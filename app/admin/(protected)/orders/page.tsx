export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import OrdersTable, { type OrderRow } from "@/components/OrdersTable";
import { SIZE_LABEL } from "@/lib/productSize";

const ORDER_INCLUDE = { items: { include: { product: true } } } as const;

export default async function AdminOrdersPage() {
  // Query berasingan ikut kategori (bukan satu fetch besar semua order) -
  // lebih pantas dan elak dashboard "banjir" dek order status MENUNGGU lama
  // (troli ditinggalkan) yang tak relevan lagi untuk processing.
  const [manualCourierRaw, newOrdersRaw, processingFailedRaw, inProcessRaw, shippedRaw, pendingPaymentRaw, paymentFailedRaw, refundedRaw] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: "BERJAYA", manualCourier: true, trackingNumber: null },
        orderBy: { seq: "asc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "BERJAYA", manualCourier: false, trackingNumber: null, fulfillmentError: null },
        orderBy: { seq: "asc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "BERJAYA", fulfillmentError: { not: null } },
        orderBy: { seq: "asc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "BERJAYA", trackingNumber: { not: null }, printedAt: null },
        orderBy: { seq: "asc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "SELESAI" },
        orderBy: { seq: "desc" },
        take: 30,
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "MENUNGGU" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "GAGAL" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: ORDER_INCLUDE,
      }),
      prisma.order.findMany({
        where: { status: "DIPULANGKAN" },
        orderBy: { refundedAt: "desc" },
        take: 30,
        include: ORDER_INCLUDE,
      }),
    ]);

  const toRow = (o: typeof newOrdersRaw[number], bucket: OrderRow["bucket"]): OrderRow => ({
    id: o.id,
    seq: o.seq,
    namaPembeli: o.namaPembeli,
    createdAt: o.createdAt.toISOString(),
    poskod: o.poskod,
    bandar: o.bandar,
    negeri: o.negeri,
    items: o.items.map((it) => ({
      nama: it.saiz ? `${it.product.nama} (${SIZE_LABEL[it.saiz]})` : it.product.nama,
      kuantiti: it.kuantiti,
    })),
    jumlahSen: o.jumlahSen,
    shippingSen: o.shippingSen,
    trackingNumber: o.trackingNumber,
    awbUrl: o.awbUrl,
    courierName: o.courierName,
    fulfillmentError: o.fulfillmentError,
    refundSen: o.refundSen,
    refundReason: o.refundReason,
    refundedAt: o.refundedAt ? o.refundedAt.toISOString() : null,
    bucket,
  });

  // New orders dipecahkan ikut jenis produk - order campuran (ada
  // sekurang-kurangnya satu item PREORDER) diletak dalam kumpulan Pre-order
  // supaya staff tak silap proses/pos sebelum stok preorder sampai.
  const newOrdersPreorder = newOrdersRaw.filter((o) => o.items.some((it) => it.product.status === "PREORDER"));
  const newOrdersReady = newOrdersRaw.filter((o) => !o.items.some((it) => it.product.status === "PREORDER"));

  const allOrders: OrderRow[] = [
    ...manualCourierRaw.map((o) => toRow(o, "MANUAL_COURIER")),
    ...pendingPaymentRaw.map((o) => toRow(o, "PENDING_PAYMENT")),
    ...newOrdersReady.map((o) => toRow(o, "NEW_READY_STOCK")),
    ...newOrdersPreorder.map((o) => toRow(o, "NEW_PREORDER")),
    ...processingFailedRaw.map((o) => toRow(o, "PROCESSING_FAILED")),
    ...inProcessRaw.map((o) => toRow(o, "IN_PROCESS")),
    ...shippedRaw.map((o) => toRow(o, "SHIPPED")),
    ...refundedRaw.map((o) => toRow(o, "REFUNDED")),
    ...paymentFailedRaw.map((o) => toRow(o, "PAYMENT_FAILED")),
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Orders &amp; Shipping</h1>
      <OrdersTable orders={allOrders} />
    </div>
  );
}
