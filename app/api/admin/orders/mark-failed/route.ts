export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { applyOrderPaymentResult } from "@/lib/orderPayment";

type MarkFailedResult = {
  orderId: string;
  seq: number;
  previousStatus: string;
  newStatus: string;
  message: string;
};

// Cleanup manual untuk order yang tersangkut MENUNGGU/GAGAL selama-lamanya -
// cth. pelanggan tak sampai pun ke BayarCash (tiada transaksi untuk resync),
// jadi order tu takkan pernah dapat webhook untuk selesaikan status dia.
// Staff guna butang ni SELEPAS cuba "Resync Payment Status" dan sahkan
// memang tiada transaksi/bayaran di BayarCash untuk order tersebut.
export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = body.orderIds || [];
  if (orderIds.length === 0) {
    return NextResponse.json({ error: "Tiada order dipilih" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({ where: { id: { in: orderIds } } });

  const results: MarkFailedResult[] = [];

  for (const order of orders) {
    if (order.status !== "MENUNGGU" && order.status !== "GAGAL") {
      results.push({
        orderId: order.id,
        seq: order.seq,
        previousStatus: order.status,
        newStatus: order.status,
        message: "Dilangkau - bukan status MENUNGGU/GAGAL",
      });
      continue;
    }

    const result = await applyOrderPaymentResult(order.id, false, null);
    results.push({
      orderId: order.id,
      seq: order.seq,
      previousStatus: order.status,
      newStatus: result.applied ? result.newStatus : order.status,
      message: result.applied ? "Ditandakan Gagal secara manual" : result.reason,
    });
  }

  return NextResponse.json({ results });
}
