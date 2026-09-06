import { prisma } from "@/lib/prisma";
import { totalStok } from "@/lib/productSize";

// Status yang bermaksud order dah "settled" - iaitu keputusan bayaran dah
// diproses (BERJAYA/GAGAL yang datang lewat/berulang TAK BOLEH overwrite ni).
const SETTLED_STATUSES = ["BERJAYA", "SELESAI", "DIPULANGKAN"] as const;

/**
 * Kemaskini status pembayaran satu Order (bukan keahlian/kelas/derma) dan
 * jalankan kesan sampingan (kurang stok, auto pre-order) bila BERJAYA.
 * Dipanggil dari DUA tempat: webhook callback BayarCash, dan admin
 * "Resync Payment Status" (bila webhook tak sampai/hilang).
 *
 * PENTING - idempoten: kalau order dah BERJAYA/SELESAI/DIPULANGKAN sebelum
 * ni, callback/resync GAGAL yang sampai lewat (cth. dari percubaan bayaran
 * PERTAMA yang gagal, padahal percubaan KEDUA dah berjaya & diproses dulu)
 * TAK akan downgrade order tu balik. Begitu juga stok TAK dikurangkan dua
 * kali kalau fungsi ni dipanggil berulang untuk order yang dah BERJAYA.
 */
export async function applyOrderPaymentResult(orderId: string, isPaid: boolean, transactionId: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return { applied: false as const, reason: "Order tidak ditemui" };

  if (SETTLED_STATUSES.includes(order.status as (typeof SETTLED_STATUSES)[number])) {
    return { applied: false as const, reason: `Order sudah ${order.status}, diabaikan` };
  }

  let oversoldNote: string | null = null;

  if (isPaid) {
    const oversoldItems: string[] = [];
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

    for (const productId of readyStockProductIds) {
      const prod = await prisma.product.findUnique({ where: { id: productId }, include: { sizes: true } });
      if (prod && prod.status === "READY_STOCK" && totalStok(prod) <= 0) {
        await prisma.product.update({ where: { id: productId }, data: { status: "PREORDER" } });
      }
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: isPaid ? "BERJAYA" : "GAGAL",
      bayarcashRef: transactionId,
      ...(oversoldNote ? { fulfillmentError: oversoldNote } : {}),
    },
  });

  return { applied: true as const, newStatus: isPaid ? "BERJAYA" : "GAGAL" };
}
