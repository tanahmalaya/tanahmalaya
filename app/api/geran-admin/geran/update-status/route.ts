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
  const geranId: string = body.geranId;
  const status: "DISAHKAN" | "DITOLAK" = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;
  const renId: string | null = body.renId || null;

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Geran not found" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[geran.status]?.includes(status)) {
    return NextResponse.json({ error: `Cannot change status from ${geran.status} to ${status}` }, { status: 400 });
  }

  // A non-REN seller's listing must be placed under a PLT-assigned REN
  // before approval - see Seller.renDisahkan & Geran.assignedRenId.
  let assignedRenId = geran.assignedRenId;
  if (status === "DISAHKAN" && !assignedRenId) {
    if (!renId) {
      return NextResponse.json({ error: "Please choose a PLT-assigned REN for this listing." }, { status: 400 });
    }
    const ren = await prisma.seller.findUnique({ where: { id: renId } });
    if (!ren || !ren.renDisahkan) {
      return NextResponse.json({ error: "The selected REN is invalid." }, { status: 400 });
    }
    assignedRenId = renId;
  }

  await prisma.geran.update({
    where: { id: geranId },
    data: {
      status,
      catatanAdmin: status === "DITOLAK" ? catatanAdmin : geran.catatanAdmin,
      assignedRenId,
    },
  });

  return NextResponse.json({ ok: true });
}
