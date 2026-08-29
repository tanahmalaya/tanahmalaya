export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import OrdersTable, { type OrderRow } from "@/components/OrdersTable";

const ORDER_INCLUDE = { items: { include: { product: true } } } as const;

export default async function AdminOrdersPage() {
  // Query berasingan ikut kategori (bukan satu fetch besar semua order) -
  // lebih pantas dan elak dashboard "banjir" dek order MENUNGGU lama
  // (troli ditinggalkan) yang tak relevan lagi untuk fulfillment.
  const [belumFulfillRaw, gagalFulfillRaw, sudahFulfillRaw, selesaiRaw, menungguRaw, gagalBayarRaw, dipulangkanRaw] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: "BERJAYA", trackingNumber: null, fulfillmentError: null },
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

  const toRow = (o: typeof belumFulfillRaw[number], bucket: OrderRow["bucket"]): OrderRow => ({
    id: o.id,
    seq: o.seq,
    namaPembeli: o.namaPembeli,
    createdAt: o.createdAt.toISOString(),
    poskod: o.poskod,
    bandar: o.bandar,
    negeri: o.negeri,
    items: o.items.map((it) => ({ nama: it.product.nama, kuantiti: it.kuantiti })),
    jumlahSen: o.jumlahSen,
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    fulfillmentError: o.fulfillmentError,
    refundSen: o.refundSen,
    refundReason: o.refundReason,
    refundedAt: o.refundedAt ? o.refundedAt.toISOString() : null,
    bucket,
  });

  const allOrders: OrderRow[] = [
    ...menungguRaw.map((o) => toRow(o, "MENUNGGU")),
    ...belumFulfillRaw.map((o) => toRow(o, "BELUM_FULFILL")),
    ...gagalFulfillRaw.map((o) => toRow(o, "GAGAL_FULFILL")),
    ...sudahFulfillRaw.map((o) => toRow(o, "SUDAH_FULFILL")),
    ...selesaiRaw.map((o) => toRow(o, "SELESAI")),
    ...dipulangkanRaw.map((o) => toRow(o, "DIPULANGKAN")),
    ...gagalBayarRaw.map((o) => toRow(o, "GAGAL_BAYARAN")),
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Pesanan &amp; Penghantaran</h1>
      <OrdersTable orders={allOrders} />
    </div>
  );
}
