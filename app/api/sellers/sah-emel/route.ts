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

// Langkah 2 daftar akaun GERAN: sahkan kod, barulah rekod Seller dicipta
// dari PendaftaranTertunda dan pengguna terus log masuk.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { email, code } = parsed.data;

  const tertunda = await prisma.pendaftaranTertunda.findUnique({ where: { email } });
  if (!tertunda) {
    return NextResponse.json(
      { error: "No pending sign-up for this email. Please sign up again." },
      { status: 404 }
    );
  }

  if (tertunda.kodLuputPada.getTime() < Date.now()) {
    await prisma.pendaftaranTertunda.delete({ where: { id: tertunda.id } });
    return NextResponse.json({ error: "Code has expired. Please sign up again." }, { status: 400 });
  }
  if (tertunda.cubaan >= OTP_MAX_ATTEMPTS) {
    await prisma.pendaftaranTertunda.delete({ where: { id: tertunda.id } });
    return NextResponse.json({ error: "Too many failed attempts. Please sign up again." }, { status: 400 });
  }

  const sah = await bcrypt.compare(code, tertunda.kodHash);
  if (!sah) {
    await prisma.pendaftaranTertunda.update({
      where: { id: tertunda.id },
      data: { cubaan: { increment: 1 } },
    });
    const baki = OTP_MAX_ATTEMPTS - (tertunda.cubaan + 1);
    return NextResponse.json(
      {
        error: baki > 0 ? `Invalid code. Attempts remaining: ${baki}.` : "Invalid code. Please sign up again.",
      },
      { status: 400 }
    );
  }

  // Emel terbukti milik pengguna - pindahkan ke akaun sebenar.
  const seller = await prisma.seller.create({
    data: {
      fullName: tertunda.fullName,
      phone: tertunda.phone,
      email: tertunda.email,
      passwordHash: tertunda.passwordHash,
      persetujuanPdpaPada: tertunda.persetujuanPdpaPada,
    },
  });
  await prisma.pendaftaranTertunda.delete({ where: { id: tertunda.id } });
  await prisma.loginEvent.create({ data: { actorType: "SELLER", actorId: seller.id } });

  setSellerCookie(signSellerSession(seller.id));
  return NextResponse.json({ fullName: seller.fullName });
}
