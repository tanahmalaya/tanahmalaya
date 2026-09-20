export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU_SEMAKAN: ["DISAHKAN", "DITOLAK"],
};

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  const permohonanId: string = body.permohonanId;
  const status: "DISAHKAN" | "DITOLAK" = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;

  const permohonan = await prisma.dronePilotApplication.findUnique({ where: { id: permohonanId } });
  if (!permohonan) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[permohonan.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot change status from ${permohonan.status} to ${status}` },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.dronePilotApplication.update({
      where: { id: permohonanId },
      data: { status, catatanAdmin: status === "DITOLAK" ? catatanAdmin : permohonan.catatanAdmin },
    }),
    ...(status === "DISAHKAN"
      ? [prisma.seller.update({ where: { id: permohonan.sellerId }, data: { dronePilotDisahkan: true } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
