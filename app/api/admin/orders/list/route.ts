export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const ids = req.nextUrl.searchParams.get("ids")?.split(",") || [];

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    orderBy: { seq: "asc" },
    include: { items: { include: { product: true } } },
  });

  const result = orders.map((o) => ({
    id: o.id,
    seq: o.seq,
    namaPembeli: o.namaPembeli,
    alamat: o.alamat,
    poskod: o.poskod,
    bandar: o.bandar,
    negeri: o.negeri,
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    items: o.items.map((it) => ({ nama: it.product.nama, kuantiti: it.kuantiti })),
  }));

  return NextResponse.json({ orders: result });
}
