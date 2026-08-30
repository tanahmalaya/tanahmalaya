export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No Kad Pengenalan mesti 12 digit tanpa tanda -"),
});

function normalisaNama(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, icNumber } = parsed.data;

  // Padan ikut icNumber (unique) DAHULU, lepas tu sahkan nama padan sekali -
  // elak sesiapa boleh "teka" rekod ahli guna IC sahaja tanpa tahu nama betul.
  const member = await prisma.member.findUnique({ where: { icNumber } });

  if (!member || normalisaNama(member.fullName) !== normalisaNama(fullName)) {
    return NextResponse.json(
      { error: "Ahli tidak dijumpai. Sila semak semula nama dan No Kad Pengenalan anda." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    memberNo: member.memberNo,
    fullName: member.fullName,
    status: member.status,
    joinedAt: member.joinedAt,
  });
}
