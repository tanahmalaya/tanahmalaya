export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSellerSession, setSellerCookie } from "@/lib/sellerAuth";
import { OTP_MAX_ATTEMPTS } from "@/lib/memberAuth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// Step 2 of Seller account login: verify the OTP code sent by
// login-request, then create a session (cookie) if valid.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { email, code } = parsed.data;

  const seller = await prisma.seller.findUnique({ where: { email } });
  if (!seller) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!seller.otpCodeHash || !seller.otpExpiresAt) {
    return NextResponse.json({ error: "No active code. Please request a new one." }, { status: 400 });
  }
  if (seller.otpExpiresAt.getTime() < Date.now()) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
  }
  if (seller.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 400 });
  }

  const valid = await bcrypt.compare(code, seller.otpCodeHash);
  if (!valid) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpAttempts: { increment: 1 } } });
    const remaining = OTP_MAX_ATTEMPTS - (seller.otpAttempts + 1);
    return NextResponse.json(
      { error: remaining > 0 ? `Invalid code. Attempts remaining: ${remaining}.` : "Invalid code. Please request a new one." },
      { status: 400 }
    );
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: { otpCodeHash: null, otpExpiresAt: null, otpAttempts: 0, otpSentAt: null },
  });
  await prisma.loginEvent.create({ data: { actorType: "SELLER", actorId: seller.id } });

  setSellerCookie(signSellerSession(seller.id));
  return NextResponse.json({ fullName: seller.fullName });
}
