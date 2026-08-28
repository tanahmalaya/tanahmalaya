export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderId: string = body.orderId;
  const refundSen: number = Math.round(Number(body.refundSen));
  const refundReason: string = (body.refundReason || "").trim();

  if (!orderId || !Number.isFinite(refundSen) || refundSen <= 0) {
    return NextResponse.json({ error: "Jumlah refund tidak sah" }, { status: 400 });
  }
  if (!refundReason) {
    return NextResponse.json({ error: "Sila isi sebab refund" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
  }

  // Hanya order yang memang dah bayar (BERJAYA - belum dipos, atau SELESAI -
  // dah dipos) boleh direfund. Order MENUNGGU/GAGAL tak pernah terima duit,
  // dan order yang dah DIPULANGKAN tak boleh direfund dua kali.
  if (order.status !== "BERJAYA" && order.status !== "SELESAI") {
    return NextResponse.json(
      { error: "Hanya order yang bayaran BERJAYA/SELESAI boleh direfund" },
      { status: 400 }
    );
  }
  if (refundSen > order.jumlahSen) {
    return NextResponse.json(
      { error: `Jumlah refund (RM ${(refundSen / 100).toFixed(2)}) melebihi jumlah order (RM ${(order.jumlahSen / 100).toFixed(2)})` },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "DIPULANGKAN",
      refundSen,
      refundReason,
      refundedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
