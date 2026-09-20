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

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Geran not found" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[geran.status]?.includes(status)) {
    return NextResponse.json({ error: `Cannot change status from ${geran.status} to ${status}` }, { status: 400 });
  }

  await prisma.geran.update({
    where: { id: geranId },
    data: {
      status,
      catatanAdmin: status === "DITOLAK" ? catatanAdmin : geran.catatanAdmin,
    },
  });

  return NextResponse.json({ ok: true });
}
