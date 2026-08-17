export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBayarcashChecksum } from "@/lib/bayarcash";

// BayarCash akan hantar POST ke sini selepas pembayaran selesai/gagal.
// Rujuk dokumentasi rasmi BayarCash untuk nama field sebenar (payload di
// bawah adalah rangka asas - sesuaikan ikut format sebenar mereka).
export async function POST(req: NextRequest) {
  const payload = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;

  const valid = verifyBayarcashChecksum(payload, payload.checksum);
  if (!valid) {
    return NextResponse.json({ error: "Checksum tidak sah" }, { status: 400 });
  }

  const { order_number: orderId, status } = payload;
  const isPaid = status === "3" || status === "success"; // sesuaikan ikut kod status BayarCash sebenar

  // Cuba padan dengan Member dahulu (bayaran keahlian)
  const member = await prisma.member.findUnique({ where: { id: orderId } });
  if (member) {
    await prisma.member.update({
      where: { id: orderId },
      data: {
        status: isPaid ? "AKTIF" : "MENUNGGU_BAYARAN",
        paymentRef: payload.transaction_id ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Kalau bukan ahli, cuba padan dengan Order (pembelian merchandise)
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: isPaid ? "BERJAYA" : "GAGAL",
        bayarcashRef: payload.transaction_id ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Order tidak ditemui" }, { status: 404 });
}
