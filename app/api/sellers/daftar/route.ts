export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, maskEmail, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/memberAuth";
import { sendSellerSahEmelEmail } from "@/lib/receiptEmails";
import { sahkanTurnstile, ipDariRequest } from "@/lib/turnstile";
import { skemaKataLaluan } from "@/lib/sellerPassword";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  phone: z.string().min(8, "Please enter a valid phone number."),
  email: z.string().email(),
  password: skemaKataLaluan,
  persetujuanPdpa: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice to continue." }),
  }),
  turnstileToken: z.string().nullable().optional(),
});

// Langkah 1 daftar akaun GERAN: simpan butiran dalam PendaftaranTertunda &
// hantar kod 6 digit ke emel. Rekod Seller sebenar hanya dicipta selepas kod
// disahkan di app/api/sellers/sah-emel.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { fullName, phone, email, password, turnstileToken } = parsed.data;

  const semakan = await sahkanTurnstile(turnstileToken, ipDariRequest(req));
  if (!semakan.ok) {
    return NextResponse.json({ error: semakan.sebab }, { status: 400 });
  }

  // Bersihkan pendaftaran terbengkalai yang dah luput - tiada guna simpan
  // nama & telefon orang yang tak pernah habiskan pendaftaran.
  await prisma.pendaftaranTertunda.deleteMany({ where: { kodLuputPada: { lt: new Date() } } });

  const sedia = await prisma.seller.findUnique({ where: { email } });
  if (sedia) {
    return NextResponse.json(
      {
        error: "An account with this email already exists. Please log in instead.",
        kod: "AKAUN_WUJUD",
      },
      { status: 409 }
    );
  }

  const tertunda = await prisma.pendaftaranTertunda.findUnique({ where: { email } });
  if (tertunda) {
    const saatSejakHantar = (Date.now() - tertunda.kodDihantarPada.getTime()) / 1000;
    if (saatSejakHantar < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        {
          error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - saatSejakHantar)} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }
  }

  const code = generateOtpCode();
  const medanKod = {
    kodHash: await bcrypt.hash(code, 10),
    kodLuputPada: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    cubaan: 0,
    kodDihantarPada: new Date(),
  };
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.pendaftaranTertunda.upsert({
    where: { email },
    create: {
      fullName,
      phone,
      email,
      passwordHash,
      persetujuanPdpaPada: new Date(),
      ...medanKod,
    },
    update: {
      fullName,
      phone,
      passwordHash,
      persetujuanPdpaPada: new Date(),
      ...medanKod,
    },
  });

  try {
    await sendSellerSahEmelEmail({ fullName, email, code });
  } catch (e) {
    console.error("Gagal hantar kod sahkan emel GERAN:", e);
    return NextResponse.json({ error: "Failed to send the code. Please try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ maskedEmail: maskEmail(email) });
}
