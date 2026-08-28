export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = body.orderIds || [];

  // Bila staff klik "Selesai Cetak", order terus ditandakan SELESAI (order
  // dah dipos) - ni definisi "Complete" untuk dashboard. Hanya order yang
  // BERJAYA (bayaran sah) yang boleh beralih ke SELESAI.
  await prisma.order.updateMany({
    where: { id: { in: orderIds }, status: "BERJAYA" },
    data: { printedAt: new Date(), status: "SELESAI" },
  });

  return NextResponse.json({ ok: true });
}
