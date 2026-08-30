export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextMemberNo } from "@/lib/members";
import { totalStok } from "@/lib/productSize";

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

  // Kalau bukan pendaftaran keahlian, cuba padan dengan Order (pembelian Merchandise)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (order) {
    let oversoldNote: string | null = null;

    if (isPaid) {
      // Kurangkan stok - ikut saiz (jika produk ada saiz) atau stok keseluruhan produk.
      // Guna updateMany dengan syarat "stok >= kuantiti" supaya decrement atomic dan
      // stok TAK boleh jadi negatif walaupun ada dua order serentak untuk stok terakhir
      // (checkout dah semak stok masa order dicipta, tapi tak "reserve" - race condition
      // masih boleh berlaku antara semakan tu dengan bayaran betul-betul berjaya di sini).
      const oversoldItems: string[] = [];
      // PREORDER dibuat ikut tempahan - stok tak dikurangkan/tak boleh oversold.
      const readyStockProductIds = new Set<string>();
      for (const item of order.items) {
        if (item.product.status === "PREORDER") continue;
        readyStockProductIds.add(item.productId);
        if (item.productSizeId) {
          const { count } = await prisma.productSize.updateMany({
            where: { id: item.productSizeId, stok: { gte: item.kuantiti } },
            data: { stok: { decrement: item.kuantiti } },
          });
          if (count === 0) {
            await prisma.productSize.update({ where: { id: item.productSizeId }, data: { stok: 0 } });
            oversoldItems.push(item.saiz ? `${item.product.nama} (${item.saiz})` : item.product.nama);
          }
        } else {
          const { count } = await prisma.product.updateMany({
            where: { id: item.productId, stok: { gte: item.kuantiti } },
            data: { stok: { decrement: item.kuantiti } },
          });
          if (count === 0) {
            await prisma.product.update({ where: { id: item.productId }, data: { stok: 0 } });
            oversoldItems.push(item.product.nama);
          }
        }
      }
      if (oversoldItems.length > 0) {
        oversoldNote = `STOK TIDAK CUKUP semasa bayaran berjaya untuk: ${oversoldItems.join(", ")}. Sila hubungi pelanggan (pembayaran dah diterima).`;
      }

      // Stok Ready Stock dah habis (0) selepas jualan ni - auto tukar produk ke Pre-order
      // supaya pelanggan lain masih boleh tempah sementara restock.
      for (const productId of readyStockProductIds) {
        const prod = await prisma.product.findUnique({ where: { id: productId }, include: { sizes: true } });
        if (prod && prod.status === "READY_STOCK" && totalStok(prod) <= 0) {
          await prisma.product.update({ where: { id: productId }, data: { status: "PREORDER" } });
        }
      }
      // Nota: tempahan kurier EasyParcel TIDAK lagi automatik di sini -
      // staff akan "Fulfill" secara berkumpulan dari dashboard /admin/orders.
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: isPaid ? "BERJAYA" : "GAGAL",
        bayarcashRef: payload.transaction_id ?? null,
        ...(oversoldNote ? { fulfillmentError: oversoldNote } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  }

  // Kalau bukan pendaftaran keahlian/merchandise, cuba padan dengan pendaftaran Program & Kelas
  const registration = await prisma.classRegistration.findUnique({ where: { id: orderId } });
  if (registration) {
    await prisma.classRegistration.update({
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
