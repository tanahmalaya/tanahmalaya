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
  const geranId: string = body.geranId;
  const status: "DISAHKAN" | "DITOLAK" = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;
  const renId: string | null = body.renId || null;

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Geran tidak dijumpai" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[geran.status]?.includes(status)) {
    return NextResponse.json({ error: `Tidak boleh tukar status daripada ${geran.status} ke ${status}` }, { status: 400 });
  }

  // Penjual bukan REN wajib diletakkan di bawah REN pilihan PLT sebelum
  // diluluskan - lihat Seller.renDisahkan & Geran.assignedRenId.
  let assignedRenId = geran.assignedRenId;
  if (status === "DISAHKAN" && !assignedRenId) {
    if (!renId) {
      return NextResponse.json({ error: "Sila pilih REN pilihan PLT untuk penyenaraian ini." }, { status: 400 });
    }
    const ren = await prisma.seller.findUnique({ where: { id: renId } });
    if (!ren || !ren.renDisahkan) {
      return NextResponse.json({ error: "REN yang dipilih tidak sah." }, { status: 400 });
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
