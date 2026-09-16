export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, maskEmail, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/memberAuth";
import { sendSellerLoginOtpEmail } from "@/lib/receiptEmails";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
});

// Langkah 1 log masuk akaun Penjual: daftar (atau kemaskini profil jika
// sudah wujud) guna nama + telefon + e-mel, terus hantar kod OTP 6-digit ke
// e-mel - lihat login-verify untuk langkah ke-2. Tiada kelulusan admin di
// peringkat akaun (kelulusan hanya untuk setiap penyenaraian Geran).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, phone, email } = parsed.data;

  const existing = await prisma.seller.findUnique({ where: { email } });
  if (existing?.otpSentAt) {
    const secondsSinceLastSend = (Date.now() - existing.otpSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Sila tunggu ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)} saat sebelum minta kod baharu.` },
        { status: 429 }
      );
    }
  }

  const code = generateOtpCode();
  const otpCodeHash = await bcrypt.hash(code, 10);
  const otpFields = {
    otpCodeHash,
    otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    otpAttempts: 0,
    otpSentAt: new Date(),
  };

  const seller = await prisma.seller.upsert({
    where: { email },
    create: { fullName, phone, email, ...otpFields },
    update: { fullName, phone, ...otpFields },
  });

  try {
    await sendSellerLoginOtpEmail({ fullName: seller.fullName, email: seller.email, code });
  } catch (e) {
    console.error("Gagal hantar emel OTP log masuk Penjual:", e);
    return NextResponse.json({ error: "Gagal hantar kod ke e-mel. Sila cuba lagi sebentar." }, { status: 502 });
  }

  return NextResponse.json({ maskedEmail: maskEmail(seller.email) });
}
