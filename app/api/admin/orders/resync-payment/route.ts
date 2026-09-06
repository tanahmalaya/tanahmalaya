export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getBayarcashTransactionsByOrder, pickRelevantBayarcashTransaction, BAYARCASH_STATUS } from "@/lib/bayarcash";
import { applyOrderPaymentResult } from "@/lib/orderPayment";

type ResyncResult = {
  orderId: string;
  seq: number;
  previousStatus: string;
  newStatus: string;
  message: string;
};

// Tarik status pembayaran SEBENAR terus dari BayarCash (bukan tunggu webhook)
// untuk order yang tersangkut MENUNGGU/GAGAL - guna bila webhook hilang/lambat,
// atau bila pelanggan buat >1 percubaan bayaran untuk order yang sama.
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

  const results: ResyncResult[] = [];

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

    let transactions;
    try {
      transactions = await getBayarcashTransactionsByOrder(order.id);
    } catch (e) {
      results.push({
        orderId: order.id,
        seq: order.seq,
        previousStatus: order.status,
        newStatus: order.status,
        message: `Ralat semasa hubungi BayarCash: ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }

    const relevant = pickRelevantBayarcashTransaction(transactions);
    if (!relevant) {
      results.push({
        orderId: order.id,
        seq: order.seq,
        previousStatus: order.status,
        newStatus: order.status,
        message: "Tiada transaksi dijumpai di BayarCash - pelanggan mungkin belum cuba bayar lagi",
      });
      continue;
    }

    const isPaid = relevant.status === BAYARCASH_STATUS.SUCCESS;
    // Transaksi PENDING/NEW - keputusan belum sedia lagi di BayarCash, jangan tukar apa-apa.
    if (!isPaid && relevant.status !== BAYARCASH_STATUS.FAILED && relevant.status !== BAYARCASH_STATUS.CANCELLED) {
      results.push({
        orderId: order.id,
        seq: order.seq,
        previousStatus: order.status,
        newStatus: order.status,
        message: `Transaksi ${relevant.id} masih "${relevant.status_description}" di BayarCash - belum ada keputusan muktamad`,
      });
      continue;
    }

    const result = await applyOrderPaymentResult(order.id, isPaid, relevant.id);
    results.push({
      orderId: order.id,
      seq: order.seq,
      previousStatus: order.status,
      newStatus: result.applied ? result.newStatus : order.status,
      message: result.applied
        ? `Dikemaskini ikut transaksi ${relevant.id} (${relevant.status_description})`
        : result.reason,
    });
  }

  return NextResponse.json({ results });
}
