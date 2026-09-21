export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, maskEmail, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/memberAuth";
import { sendSellerResetKataLaluanEmail } from "@/lib/receiptEmails";
import { sahkanTurnstile, ipDariRequest } from "@/lib/turnstile";

const schema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().nullable().optional(),
});

// Hantar kod untuk set kata laluan baharu. Aliran sama untuk dua keadaan:
// pengguna terlupa kata laluan, dan akaun lama yang belum pernah ada kata
// laluan langsung.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { email, turnstileToken } = parsed.data;

  const semakan = await sahkanTurnstile(turnstileToken, ipDariRequest(req));
  if (!semakan.ok) {
    return NextResponse.json({ error: semakan.sebab }, { status: 400 });
  }

  const seller = await prisma.seller.findUnique({ where: { email } });

  // Balas sama ada akaun wujud atau tidak - borang ni terbuka kepada awam,
  // jadi ia tak patut jadi alat untuk semak emel siapa ada akaun di sini.
  const jawapan = NextResponse.json({ maskedEmail: maskEmail(email) });
  if (!seller) return jawapan;

  if (seller.otpSentAt) {
    const saat = (Date.now() - seller.otpSentAt.getTime()) / 1000;
    if (saat < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - saat)} seconds before requesting a new code.` },
        { status: 429 }
      );
    }
  }

  const code = generateOtpCode();
  await prisma.seller.update({
    where: { id: seller.id },
    data: {
      otpCodeHash: await bcrypt.hash(code, 10),
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      otpAttempts: 0,
      otpSentAt: new Date(),
    },
  });

  try {
    await sendSellerResetKataLaluanEmail({ fullName: seller.fullName, email: seller.email, code });
  } catch (e) {
    console.error("Gagal hantar kod set kata laluan GERAN:", e);
    return NextResponse.json({ error: "Failed to send the code. Please try again shortly." }, { status: 502 });
  }

  return jawapan;
}
