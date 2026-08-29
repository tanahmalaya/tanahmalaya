"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type OrderPrintView = {
  id: string;
  seq: number;
  createdAt: string;
  namaPembeli: string;
  emel: string;
  telefon: string;
  alamat: string;
  poskod: string;
  bandar: string;
  negeri: string;
  trackingNumber: string | null;
  awbUrl: string | null;
  courierName: string | null;
  items: { nama: string; kuantiti: number }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Print AWB - shows the ACTUAL EasyParcel shipping label (AWB) for each
 * order plus item details for packing. Deliberately NO price/invoice
 * (that lives separately at /admin/orders/print for accounting records).
 * Staff manually confirm "Mark as Shipped" after printing/sticking the AWB -
 * this is never set automatically.
 */
export default function PackingSlipPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get("ids")?.split(",") || [];
  const [orders, setOrders] = useState<OrderPrintView[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (ids.length === 0) return;
    fetch(`/api/admin/orders/list?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkShipped() {
    await fetch("/api/admin/orders/mark-printed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: ids }),
    });
    setDone(true);
    setTimeout(() => router.push("/admin/orders"), 1500);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 print:hidden flex-wrap">
        <button onClick={() => window.print()} className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-5 py-2">
          PRINT (PDF)
        </button>
        <button
          onClick={handleMarkShipped}
          disabled={done}
          className="bg-brand-dark text-white font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {done ? "SHIPPED ✓" : "MARK AS SHIPPED"}
        </button>
        <p className="text-xs text-brand-dark/50 ml-auto max-w-xs">
          Only click "Mark as Shipped" once the AWB is actually printed and stuck on the parcel.
        </p>
      </div>

      <h1 className="text-2xl font-bold mb-6 print:hidden">
        Print AWB — {orders.length} Order(s)
      </h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div key={o.id} className="border border-brand-dark/20 rounded-md p-6 break-inside-avoid print:break-after-page">
            <div className="flex justify-between items-start border-b border-brand-dark/10 pb-3 mb-3">
              <div>
                <p className="font-bold text-lg">Order #{o.seq}</p>
                <p className="text-sm text-brand-dark/70">Date: {formatDate(o.createdAt)}</p>
              </div>
              {(o.courierName || o.trackingNumber) && (
                <div className="text-right text-sm">
                  <p className="font-semibold">{o.courierName || "-"}</p>
                  <p className="text-brand-dark/60">{o.trackingNumber || "-"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">Customer</p>
                <p className="font-semibold">{o.namaPembeli}</p>
                <p className="text-sm text-brand-dark/70">{o.telefon}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">Shipping Address</p>
                <p className="text-sm text-brand-dark/70">
                  {o.alamat}, {o.poskod} {o.bandar}, {o.negeri}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 print:hidden">
                <p className="text-xs font-semibold text-brand-dark/60 uppercase">AWB (Shipping Label)</p>
                {o.awbUrl && (
                  <a href={o.awbUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-brand-gold">
                    Open AWB PDF in new tab →
                  </a>
                )}
              </div>
              {o.awbUrl ? (
                <iframe src={o.awbUrl} title={`AWB #${o.seq}`} className="w-full h-[420px] border border-brand-dark/20 rounded-sm" />
              ) : (
                <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-sm p-3">
                  AWB link not available for this order yet. Check the EasyParcel dashboard directly using the
                  tracking number above.
                </p>
              )}
            </div>

            <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">Items to Pack</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-dark/20 text-left">
                  <th className="py-1 font-semibold">Product</th>
                  <th className="py-1 font-semibold text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it, i) => (
                  <tr key={i} className="border-b border-brand-dark/5">
                    <td className="py-1">{it.nama}</td>
                    <td className="py-1 text-right">{it.kuantiti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
