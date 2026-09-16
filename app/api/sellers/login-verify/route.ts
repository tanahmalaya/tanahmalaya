export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSellerSession, setSellerCookie } from "@/lib/sellerAuth";
import { OTP_MAX_ATTEMPTS } from "@/lib/memberAuth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Kod mesti 6 digit"),
});

// Langkah 2 log masuk akaun Penjual: sahkan kod OTP yang dihantar oleh
// login-request, terus cipta sesi (cookie) kalau berjaya.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { email, code } = parsed.data;

  const seller = await prisma.seller.findUnique({ where: { email } });
  if (!seller) {
    return NextResponse.json({ error: "Akaun tidak dijumpai." }, { status: 404 });
  }

  if (!seller.otpCodeHash || !seller.otpExpiresAt) {
    return NextResponse.json({ error: "Tiada kod aktif. Sila mohon kod baharu." }, { status: 400 });
  }
  if (seller.otpExpiresAt.getTime() < Date.now()) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Kod telah tamat tempoh. Sila mohon kod baharu." }, { status: 400 });
  }
  if (seller.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Terlalu banyak percubaan gagal. Sila mohon kod baharu." }, { status: 400 });
  }

  const valid = await bcrypt.compare(code, seller.otpCodeHash);
  if (!valid) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpAttempts: { increment: 1 } } });
    const baki = OTP_MAX_ATTEMPTS - (seller.otpAttempts + 1);
    return NextResponse.json(
      { error: baki > 0 ? `Kod tidak sah. Baki percubaan: ${baki}.` : "Kod tidak sah. Sila mohon kod baharu." },
      { status: 400 }
    );
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: { otpCodeHash: null, otpExpiresAt: null, otpAttempts: 0, otpSentAt: null },
  });

  setSellerCookie(signSellerSession(seller.id));
  return NextResponse.json({ fullName: seller.fullName });
}
