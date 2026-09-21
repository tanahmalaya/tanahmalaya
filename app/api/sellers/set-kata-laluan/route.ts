export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSellerSession, setSellerCookie } from "@/lib/sellerAuth";
import { OTP_MAX_ATTEMPTS } from "@/lib/memberAuth";
import { skemaKataLaluan } from "@/lib/sellerPassword";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  password: skemaKataLaluan,
});

// Sahkan kod dari app/api/sellers/lupa-kata-laluan, kemudian set kata laluan
// baharu dan terus log masuk.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { email, code, password } = parsed.data;

  const seller = await prisma.seller.findUnique({ where: { email } });
  if (!seller || !seller.otpCodeHash || !seller.otpExpiresAt) {
    return NextResponse.json({ error: "No active code. Please request a new one." }, { status: 400 });
  }

  if (seller.otpExpiresAt.getTime() < Date.now()) {
    await prisma.seller.update({
      where: { id: seller.id },
      data: { otpCodeHash: null, otpExpiresAt: null, otpSentAt: null },
    });
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
  }
  if (seller.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.seller.update({
      where: { id: seller.id },
      data: { otpCodeHash: null, otpExpiresAt: null, otpSentAt: null },
    });
    return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 400 });
  }

  const sah = await bcrypt.compare(code, seller.otpCodeHash);
  if (!sah) {
    await prisma.seller.update({ where: { id: seller.id }, data: { otpAttempts: { increment: 1 } } });
    const baki = OTP_MAX_ATTEMPTS - (seller.otpAttempts + 1);
    return NextResponse.json(
      { error: baki > 0 ? `Invalid code. Attempts remaining: ${baki}.` : "Invalid code. Please request a new one." },
      { status: 400 }
    );
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      otpCodeHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpSentAt: null,
      // Kod yang betul membuktikan pengguna pegang emel itu, jadi kunci
      // cubaan log masuk boleh dilepaskan sekali.
      cubaanLogMasuk: 0,
      dikunciSehingga: null,
    },
  });
  await prisma.loginEvent.create({ data: { actorType: "SELLER", actorId: seller.id } });

  setSellerCookie(signSellerSession(seller.id));
  return NextResponse.json({ fullName: seller.fullName });
}
