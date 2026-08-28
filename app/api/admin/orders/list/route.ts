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

  const result = orders.map((o) => {
    const jumlahKecilSen = o.items.reduce(
      (sum, it) => sum + it.hargaSen * it.kuantiti,
      0
    );

    return {
      id: o.id,
      seq: o.seq,
      createdAt: o.createdAt,
      status: o.status,
      namaPembeli: o.namaPembeli,
      emel: o.emel,
      telefon: o.telefon,
      alamat: o.alamat,
      poskod: o.poskod,
      bandar: o.bandar,
      negeri: o.negeri,
      trackingNumber: o.trackingNumber,
      courierName: o.courierName,
      bayarcashRef: o.bayarcashRef,
      jumlahKecilSen,
      shippingSen: o.shippingSen,
      jumlahSen: o.jumlahSen,
      items: o.items.map((it) => ({
        nama: it.product.nama,
        kuantiti: it.kuantiti,
        hargaSen: it.hargaSen,
        subjumlahSen: it.hargaSen * it.kuantiti,
      })),
    };
  });

  return NextResponse.json({ orders: result });
}
