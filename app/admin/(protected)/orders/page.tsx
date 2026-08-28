export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  BelumFulfillPanel,
  SudahFulfillPanel,
  GagalFulfillPanel,
  MenungguBayaranPanel,
  GagalBayaranPanel,
  SelesaiPanel,
  DipulangkanPanel,
} from "@/components/OrderFulfillmentPanels";

const ORDER_INCLUDE = { items: { include: { product: true } } } as const;

export default async function AdminOrdersPage() {
  // Query berasingan ikut seksyen dashboard (bukan satu fetch besar semua
  // order) - lebih pantas dan elak dashboard "banjir" dek order MENUNGGU
  // lama (troli ditinggalkan) yang tak relevan lagi untuk fulfillment.
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

  const toView = (o: typeof belumFulfillRaw[number]) => ({
    id: o.id,
    seq: o.seq,
    namaPembeli: o.namaPembeli,
    poskod: o.poskod,
    bandar: o.bandar,
    negeri: o.negeri,
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    fulfillmentError: o.fulfillmentError,
    items: o.items.map((it) => ({ nama: it.product.nama, kuantiti: it.kuantiti })),
    jumlahSen: o.jumlahSen,
    createdAt: o.createdAt.toISOString(),
    refundSen: o.refundSen,
    refundReason: o.refundReason,
    refundedAt: o.refundedAt ? o.refundedAt.toISOString() : null,
  });

  const belumFulfill = belumFulfillRaw.map(toView);
  const gagalFulfill = gagalFulfillRaw.map(toView);
  const sudahFulfill = sudahFulfillRaw.map(toView);
  const selesai = selesaiRaw.map(toView);
  const menunggu = menungguRaw.map(toView);
  const gagalBayar = gagalBayarRaw.map(toView);
  const dipulangkan = dipulangkanRaw.map(toView);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Pesanan &amp; Penghantaran</h1>

      {menunggu.length > 0 && (
        <section className="mb-10">
          <h2 className="font-semibold mb-3 text-brand-dark/60">
            Menunggu Bayaran ({menunggu.length})
          </h2>
          <MenungguBayaranPanel orders={menunggu} />
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-semibold mb-3">
          1. Belum Fulfill <span className="text-brand-dark/50 font-normal">({belumFulfill.length})</span>
        </h2>
        <BelumFulfillPanel orders={belumFulfill} />
      </section>

      {gagalFulfill.length > 0 && (
        <section className="mb-10">
          <h2 className="font-semibold mb-3 text-red-600">
            Gagal Fulfill ({gagalFulfill.length}) — perlu semakan
          </h2>
          <GagalFulfillPanel orders={gagalFulfill} />
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-semibold mb-3">
          2. Sudah Fulfill, Belum Cetak{" "}
          <span className="text-brand-dark/50 font-normal">({sudahFulfill.length})</span>
        </h2>
        <SudahFulfillPanel orders={sudahFulfill} />
      </section>

      <section className="mb-10">
        <h2 className="font-semibold mb-3">
          3. Selesai <span className="text-brand-dark/50 font-normal">({selesai.length})</span>
        </h2>
        <SelesaiPanel orders={selesai} />
      </section>

      {dipulangkan.length > 0 && (
        <section className="mb-10">
          <h2 className="font-semibold mb-3 text-brand-dark/60">
            Dipulangkan / Refund ({dipulangkan.length})
          </h2>
          <DipulangkanPanel orders={dipulangkan} />
        </section>
      )}

      {gagalBayar.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-brand-dark/40">
            Gagal Bayaran ({gagalBayar.length})
          </h2>
          <GagalBayaranPanel orders={gagalBayar} />
        </section>
      )}
    </div>
  );
}
