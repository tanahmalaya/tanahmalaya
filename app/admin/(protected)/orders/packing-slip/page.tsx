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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printingAll, setPrintingAll] = useState(false);
  const [printProgress, setPrintProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;
    fetch(`/api/admin/orders/list?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        const fetched: OrderPrintView[] = data.orders || [];
        setOrders(fetched);
        setSelected(new Set(fetched.map((o) => o.id)));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))));
  }

  async function markShipped(orderIds: string[]) {
    if (orderIds.length === 0) return;
    await fetch("/api/admin/orders/mark-printed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds }),
    });
    setDone(true);
    setTimeout(() => router.push("/admin/orders"), 1500);
  }

  // The AWB PDF is hosted cross-origin (EasyParcel), so a directly-embedded
  // iframe can't be scripted (browsers block contentWindow.print() /
  // afterprint across origins). Fetch each PDF through our own same-origin
  // proxy first, turn it into a blob: URL (which IS same-origin/scriptable),
  // then print it in a hidden iframe - one at a time, waiting for the print
  // dialog to close before moving to the next AWB.
  function printBlobUrl(blobUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        iframe.remove();
        resolve();
      };
      iframe.onload = () => {
        const win = iframe.contentWindow;
        if (!win) return finish();
        win.addEventListener("afterprint", finish);
        win.focus();
        win.print();
        // Fallback in case afterprint never fires.
        setTimeout(finish, 8000);
      };
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
    });
  }

  async function handlePrintAll() {
    const targets = orders.filter((o) => o.awbUrl && selected.has(o.id));
    if (targets.length === 0) return;
    setPrintingAll(true);
    for (let i = 0; i < targets.length; i++) {
      const o = targets[i];
      setPrintProgress({ current: i + 1, total: targets.length });
      try {
        const res = await fetch(`/api/admin/orders/awb-proxy?orderId=${o.id}`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        await printBlobUrl(blobUrl);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Skip this AWB (e.g. proxy/network failure) and continue with the rest.
      }
    }
    setPrintingAll(false);
    setPrintProgress(null);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const selectedPrintableCount = orders.filter((o) => o.awbUrl && selected.has(o.id)).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-3 print:hidden flex-wrap">
        <button onClick={() => window.print()} className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-5 py-2">
          PRINT (PDF)
        </button>
        <button
          onClick={handlePrintAll}
          disabled={printingAll || selectedPrintableCount === 0}
          className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {printingAll
            ? `PRINTING ${printProgress?.current ?? 0}/${printProgress?.total ?? 0}...`
            : `PRINT SELECTED AWB (${selectedPrintableCount})`}
        </button>
        <label className="flex items-center gap-2 text-sm text-brand-dark/70 ml-2">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Select All
        </label>
        <button
          onClick={() => markShipped(orders.filter((o) => selected.has(o.id)).map((o) => o.id))}
          disabled={done || selected.size === 0}
          className="bg-brand-dark text-white font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {done ? "SHIPPED ✓" : `MARK SELECTED AS SHIPPED (${selected.size})`}
        </button>
        <button
          onClick={() => markShipped(ids)}
          disabled={done}
          className="bg-brand-dark text-white font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {done ? "SHIPPED ✓" : "MARK ALL AS SHIPPED"}
        </button>
      </div>
      <p className="text-xs text-brand-dark/50 mb-6 print:hidden max-w-xl">
        Only click "Mark as Shipped" once the AWB is actually printed and stuck on the parcel.
      </p>

      <h1 className="text-2xl font-bold mb-6 print:hidden">
        Print AWB — {orders.length} Order(s)
      </h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div key={o.id} className="border border-brand-dark/20 rounded-md p-6 break-inside-avoid print:break-after-page">
            <div className="flex justify-between items-start border-b border-brand-dark/10 pb-3 mb-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 print:hidden"
                  checked={selected.has(o.id)}
                  onChange={() => toggleSelected(o.id)}
                />
                <div>
                  <p className="font-bold text-lg">Order #{o.seq}</p>
                  <p className="text-sm text-brand-dark/70">Date: {formatDate(o.createdAt)}</p>
                </div>
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
                <iframe
                  src={o.awbUrl}
                  title={`AWB #${o.seq}`}
                  className="w-full h-[420px] border border-brand-dark/20 rounded-sm"
                />
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
