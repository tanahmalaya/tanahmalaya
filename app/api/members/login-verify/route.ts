export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signMemberSession, setMemberCookie, OTP_MAX_ATTEMPTS } from "@/lib/memberAuth";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/),
  code: z.string().regex(/^\d{6}$/, "Kod mesti 6 digit"),
});

function normalisaNama(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

// Langkah 2 log masuk Ahli PLT: sahkan kod OTP yang dihantar oleh
// login-request, terus cipta sesi (cookie) kalau berjaya.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, icNumber, code } = parsed.data;

  const member = await prisma.member.findUnique({ where: { icNumber } });
  if (!member || normalisaNama(member.fullName) !== normalisaNama(fullName)) {
    return NextResponse.json({ error: "Ahli tidak dijumpai." }, { status: 404 });
  }
  if (member.type !== "PLT" || member.status !== "AKTIF") {
    return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 403 });
  }

  if (!member.otpCodeHash || !member.otpExpiresAt) {
    return NextResponse.json({ error: "Tiada kod aktif. Sila mohon kod baharu." }, { status: 400 });
  }
  if (member.otpExpiresAt.getTime() < Date.now()) {
    await prisma.member.update({ where: { id: member.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Kod telah tamat tempoh. Sila mohon kod baharu." }, { status: 400 });
  }
  if (member.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.member.update({ where: { id: member.id }, data: { otpCodeHash: null, otpExpiresAt: null } });
    return NextResponse.json({ error: "Terlalu banyak percubaan gagal. Sila mohon kod baharu." }, { status: 400 });
  }

  const valid = await bcrypt.compare(code, member.otpCodeHash);
  if (!valid) {
    await prisma.member.update({ where: { id: member.id }, data: { otpAttempts: { increment: 1 } } });
    const baki = OTP_MAX_ATTEMPTS - (member.otpAttempts + 1);
    return NextResponse.json(
      { error: baki > 0 ? `Kod tidak sah. Baki percubaan: ${baki}.` : "Kod tidak sah. Sila mohon kod baharu." },
      { status: 400 }
    );
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { otpCodeHash: null, otpExpiresAt: null, otpAttempts: 0, otpSentAt: null },
  });

  setMemberCookie(signMemberSession(member.id));
  return NextResponse.json({ fullName: member.fullName, memberNo: member.memberNo });
}
