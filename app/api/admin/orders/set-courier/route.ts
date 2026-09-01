export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// Staff pilih kurier & sahkan caj penghantaran secara manual untuk order
// yang ditanda `manualCourier` (SPX & J&T dua-dua tak tersedia untuk
// destinasi tu masa checkout). Selepas ni order boleh diproses macam biasa
// melalui /api/admin/orders/fulfill - checkEasyParcelRate akan cari
// service_id terkini untuk courierName yang staff pilih di sini.
export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderId: string = body.orderId;
  const courierName: string = (body.courierName || "").trim();
  const shippingSen: number = Math.round(Number(body.shippingSen));

  if (!orderId || !courierName) {
    return NextResponse.json({ error: "orderId dan courierName diperlukan" }, { status: 400 });
  }
  if (!Number.isFinite(shippingSen) || shippingSen < 0) {
    return NextResponse.json({ error: "Caj penghantaran tidak sah" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
  }
  if (order.status !== "BERJAYA" || order.trackingNumber) {
    return NextResponse.json({ error: "Order tidak sah untuk diset kurier manual" }, { status: 400 });
  }

  const subtotalSen = order.items.reduce((sum, it) => sum + it.hargaSen * it.kuantiti, 0);
  const jumlahSenBaru = subtotalSen + shippingSen;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      courierName,
      serviceId: null, // biar fulfill cari service_id TERKINI untuk kurier ni masa booking sebenar
      shippingSen,
      jumlahSen: jumlahSenBaru,
      manualCourier: false,
      fulfillmentError: null,
    },
  });

  return NextResponse.json({ ok: true, jumlahSen: jumlahSenBaru });
}
