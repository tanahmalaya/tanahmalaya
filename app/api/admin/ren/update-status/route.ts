export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU_SEMAKAN: ["DISAHKAN", "DITOLAK"],
};

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const permohonanId: string = body.permohonanId;
  const status: "DISAHKAN" | "DITOLAK" = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;

  const permohonan = await prisma.renApplication.findUnique({ where: { id: permohonanId } });
  if (!permohonan) {
    return NextResponse.json({ error: "Permohonan tidak dijumpai" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[permohonan.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Tidak boleh tukar status daripada ${permohonan.status} ke ${status}` },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.renApplication.update({
      where: { id: permohonanId },
      data: { status, catatanAdmin: status === "DITOLAK" ? catatanAdmin : permohonan.catatanAdmin },
    }),
    ...(status === "DISAHKAN"
      ? [prisma.seller.update({ where: { id: permohonan.sellerId }, data: { renDisahkan: true } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
