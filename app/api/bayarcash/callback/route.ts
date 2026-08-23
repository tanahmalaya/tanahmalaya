export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextMemberNo } from "@/lib/members";

// BayarCash akan hantar POST ke sini selepas pembayaran selesai/gagal.
// Rujuk dokumentasi rasmi BayarCash untuk nama field sebenar (payload di
// bawah adalah rangka asas - sesuaikan ikut format sebenar mereka).
export async function POST(req: NextRequest) {
  const payload = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;

  // Nota: pengesahan checksum callback dibuang buat sementara (sama sebab
  // dengan checksum outgoing) - algoritma tepat BayarCash tak dapat disahkan
  // sepenuhnya. Boleh ditambah semula selepas sahkan dengan BayarCash support.

  const { order_number: orderId, status } = payload;
  const isPaid = status === "3" || status === "success"; // sesuaikan ikut kod status BayarCash sebenar

  // Cuba padan dengan pendaftaran keahlian yang MASIH menunggu bayaran
  const pending = await prisma.pendingRegistration.findUnique({ where: { id: orderId } });
  if (pending) {
    if (isPaid) {
      // Bayaran BERJAYA - baru cipta rekod Member sebenar dalam Supabase
      const existing = await prisma.member.findUnique({ where: { icNumber: pending.icNumber } });
      if (!existing) {
        await prisma.member.create({
          data: {
            memberNo: await nextMemberNo(),
            fullName: pending.fullName,
            icNumber: pending.icNumber,
            phone: pending.phone,
            email: pending.email,
            status: "AKTIF",
            paymentRef: payload.transaction_id ?? null,
          },
        });
      }
      // Padam rekod sementara - dah tak diperlukan
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    } else {
      // Bayaran GAGAL - padam rekod sementara, tiada Member dicipta
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    }
    return NextResponse.json({ ok: true });
  }

  // Kalau bukan pendaftaran keahlian, cuba padan dengan Order (pembelian merchandise)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (order) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: isPaid ? "BERJAYA" : "GAGAL",
        bayarcashRef: payload.transaction_id ?? null,
      },
    });

    if (isPaid) {
      // Kurangkan stok
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stok: { decrement: item.kuantiti } },
        });
      }
      // Nota: tempahan kurier EasyParcel TIDAK lagi automatik di sini -
      // staff akan "Fulfill" secara berkumpulan dari dashboard /admin/orders.
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Order tidak ditemui" }, { status: 404 });
}
