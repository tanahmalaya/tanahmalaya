export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No Kad Pengenalan mesti 12 digit tanpa tanda -"),
  bankName: z.string().min(2),
  accountNo: z.string().min(5),
  accountHolder: z.string().min(2),
});

function normalisaNama(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

// Ahli yang DITOLAK (status TIDAK_AKTIF) selepas bayar boleh mohon refund yuran
// di sini - dipanggil dari borang refund di /keahlian/semak. Admin proses
// transfer bank secara manual (bukan automatik BayarCash) lepas tu tandakan selesai.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, icNumber, bankName, accountNo, accountHolder } = parsed.data;

  const member = await prisma.member.findUnique({ where: { icNumber } });
  if (!member || normalisaNama(member.fullName) !== normalisaNama(fullName)) {
    return NextResponse.json(
      { error: "Ahli tidak dijumpai. Sila semak semula nama dan No Kad Pengenalan anda." },
      { status: 404 }
    );
  }

  if (member.status !== "TIDAK_AKTIF") {
    return NextResponse.json(
      { error: "Permohonan refund hanya terbuka untuk pendaftaran yang ditolak." },
      { status: 400 }
    );
  }

  if (member.refundedAt) {
    return NextResponse.json({ error: "Refund untuk pendaftaran ini sudah selesai diproses." }, { status: 400 });
  }

  await prisma.member.update({
    where: { id: member.id },
    data: {
      refundRequested: true,
      refundBankName: bankName,
      refundAccountNo: accountNo,
      refundAccountHolder: accountHolder,
      refundRequestedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
