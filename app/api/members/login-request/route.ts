export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, maskEmail, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/memberAuth";
import { sendMemberLoginOtpEmail } from "@/lib/receiptEmails";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No Kad Pengenalan mesti 12 digit tanpa tanda -"),
});

function normalisaNama(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

// Langkah 1 log masuk Ahli PLT: sahkan Nama + No. KP (macam Semak Keahlian),
// kemudian hantar kod OTP 6-digit ke e-mel berdaftar - lihat login-verify
// untuk langkah ke-2.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, icNumber } = parsed.data;

  const member = await prisma.member.findUnique({ where: { icNumber } });
  if (!member || normalisaNama(member.fullName) !== normalisaNama(fullName)) {
    return NextResponse.json(
      { error: "Ahli tidak dijumpai. Sila semak semula nama dan No Kad Pengenalan anda." },
      { status: 404 }
    );
  }

  if (member.type !== "PLT" || member.status !== "AKTIF") {
    return NextResponse.json(
      {
        error:
          member.type !== "PLT"
            ? "Kawasan ini hanya untuk Ahli PLT. Rekod anda didaftarkan sebagai Ahli Bersekutu."
            : "Akaun Ahli PLT anda belum aktif. Sila hubungi PLT jika ini tidak dijangka.",
      },
      { status: 403 }
    );
  }

  if (member.otpSentAt) {
    const secondsSinceLastSend = (Date.now() - member.otpSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Sila tunggu ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)} saat sebelum minta kod baharu.` },
        { status: 429 }
      );
    }
  }

  const code = generateOtpCode();
  const otpCodeHash = await bcrypt.hash(code, 10);

  await prisma.member.update({
    where: { id: member.id },
    data: {
      otpCodeHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      otpAttempts: 0,
      otpSentAt: new Date(),
    },
  });

  try {
    await sendMemberLoginOtpEmail({ fullName: member.fullName, email: member.email, code });
  } catch (e) {
    console.error("Gagal hantar emel OTP log masuk Ahli PLT:", e);
    return NextResponse.json({ error: "Gagal hantar kod ke e-mel. Sila cuba lagi sebentar." }, { status: 502 });
  }

  return NextResponse.json({ maskedEmail: maskEmail(member.email) });
}
