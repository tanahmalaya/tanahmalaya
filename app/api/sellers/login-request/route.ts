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

// Step 1 of Seller account login: sign up (or update profile if already
// exists) using name + phone + email, then send a 6-digit OTP code to the
// email - see login-verify for step 2. No admin approval at the account
// level (approval only applies per Geran listing).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { fullName, phone, email } = parsed.data;

  const existing = await prisma.seller.findUnique({ where: { email } });
  if (existing?.otpSentAt) {
    const secondsSinceLastSend = (Date.now() - existing.otpSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)} seconds before requesting a new code.` },
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
    console.error("Failed to send Seller login OTP email:", e);
    return NextResponse.json({ error: "Failed to send code to email. Please try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ maskedEmail: maskEmail(seller.email) });
}
