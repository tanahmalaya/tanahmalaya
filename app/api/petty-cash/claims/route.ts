export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/memberAuth";

const schema = z.object({
  jumlahRM: z.number().positive(),
  kategori: z.enum(["PENGANGKUTAN", "ALAT_TULIS", "PROGRAM_AKTIVITI", "LAIN_LAIN"]),
  tujuan: z.string().min(3),
  tarikhPerbelanjaan: z.string(), // ISO date (yyyy-mm-dd dari <input type="date">)
  resitUrl: z.string().url().optional().nullable(),
  bankName: z.string().min(2),
  accountNo: z.string().min(4),
  accountHolder: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const session = getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "Sila log masuk semula" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({ where: { id: session.memberId } });
  if (!member || member.type !== "PLT" || member.status !== "AKTIF") {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const data = parsed.data;

  const [claim] = await prisma.$transaction([
    prisma.pettyCashClaim.create({
      data: {
        memberId: member.id,
        namaPemohon: member.fullName,
        memberNo: member.memberNo,
        jumlahSen: Math.round(data.jumlahRM * 100),
        kategori: data.kategori,
        tujuan: data.tujuan,
        tarikhPerbelanjaan: new Date(data.tarikhPerbelanjaan),
        resitUrl: data.resitUrl || null,
        bankName: data.bankName,
        accountNo: data.accountNo,
        accountHolder: data.accountHolder,
      },
    }),
    // Simpan maklumat bank untuk prefill tuntutan akan datang.
    prisma.member.update({
      where: { id: member.id },
      data: {
        savedBankName: data.bankName,
        savedAccountNo: data.accountNo,
        savedAccountHolder: data.accountHolder,
      },
    }),
  ]);

  return NextResponse.json({ id: claim.id, seq: claim.seq });
}

export async function GET() {
  const session = getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "Sila log masuk semula" }, { status: 401 });
  }

  const claims = await prisma.pettyCashClaim.findMany({
    where: { memberId: session.memberId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ claims });
}
