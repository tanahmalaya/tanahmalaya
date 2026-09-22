export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";

// Alur: penyenaraian masuk MENUNGGU_SEMAKAN, admin buka rundingan harga,
// kemudian siarkan bila harga dipersetujui. DALAM_RUNDINGAN boleh balik ke
// MENUNGGU_SEMAKAN kalau admin silap tekan.
const VALID_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU_SEMAKAN: ["DALAM_RUNDINGAN", "DISAHKAN", "DITOLAK"],
  DALAM_RUNDINGAN: ["MENUNGGU_SEMAKAN", "DISAHKAN", "DITOLAK"],
  DISAHKAN: ["DITOLAK"],
};

type Status = "MENUNGGU_SEMAKAN" | "DALAM_RUNDINGAN" | "DISAHKAN" | "DITOLAK";

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  const geranId: string = body.geranId;
  const status: Status = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Penyenaraian tak dijumpai" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[geran.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Tak boleh tukar status dari ${geran.status} ke ${status}` },
      { status: 400 }
    );
  }

  // Harga siaran ialah satu-satunya harga yang pembeli nampak. Tanpa ia,
  // penyenaraian akan tersiar tanpa harga langsung.
  if (status === "DISAHKAN" && geran.hargaSiaranSen === null) {
    return NextResponse.json(
      { error: "Set harga siaran dahulu sebelum siarkan penyenaraian ini." },
      { status: 400 }
    );
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
