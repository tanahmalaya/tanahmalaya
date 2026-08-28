export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { BelumFulfillPanel, SudahFulfillPanel, GagalFulfillPanel } from "@/components/OrderFulfillmentPanels";

export default async function AdminOrdersPage() {
  const allOrders = await prisma.order.findMany({
    where: { status: "BERJAYA" },
    orderBy: { seq: "asc" },
    include: { items: { include: { product: true } } },
  });

  const toView = (o: (typeof allOrders)[number]) => ({
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
  });

  const belumFulfill = allOrders
    .filter((o) => !o.trackingNumber && !o.fulfillmentError)
    .map(toView);
  const gagalFulfill = allOrders
    .filter((o) => !o.trackingNumber && o.fulfillmentError)
    .map(toView);
  const sudahFulfill = allOrders
    .filter((o) => o.trackingNumber && !o.printedAt)
    .map(toView);
  const selesai = allOrders
    .filter((o) => o.trackingNumber && o.printedAt)
    .map(toView);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Pesanan &amp; Penghantaran</h1>

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

      <section>
        <h2 className="font-semibold mb-3">
          3. Selesai Packing <span className="text-brand-dark/50 font-normal">({selesai.length})</span>
        </h2>
        <div className="space-y-2">
          {selesai.slice(0, 20).map((o) => (
            <div key={o.id} className="bg-white rounded-md shadow-sm p-4 text-sm opacity-70">
              <p className="font-semibold">
                #{o.seq} — {o.namaPembeli}
              </p>
              <p className="text-brand-dark/60">
                {o.courierName} — {o.trackingNumber}
              </p>
            </div>
          ))}
          {selesai.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada lagi.</p>}
        </div>
      </section>
    </div>
  );
}
