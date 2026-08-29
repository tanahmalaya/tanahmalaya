"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Bucket =
  | "PENDING_PAYMENT"
  | "NEW_READY_STOCK"
  | "NEW_PREORDER"
  | "PROCESSING_FAILED"
  | "IN_PROCESS"
  | "SHIPPED"
  | "REFUNDED"
  | "PAYMENT_FAILED";

export type OrderRow = {
  id: string;
  seq: number;
  namaPembeli: string;
  createdAt: string;
  poskod: string;
  bandar: string;
  negeri: string;
  items: { nama: string; kuantiti: number }[];
  jumlahSen: number;
  trackingNumber: string | null;
  awbUrl: string | null;
  courierName: string | null;
  fulfillmentError: string | null;
  refundSen: number | null;
  refundReason: string | null;
  refundedAt: string | null;
  bucket: Bucket;
};

const MAX_BULK = 30;

const TAB_DEF: { key: Bucket | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING_PAYMENT", label: "Pending Payment" },
  { key: "NEW_READY_STOCK", label: "New Orders - Ready Stock" },
  { key: "NEW_PREORDER", label: "New Orders - Pre-order" },
  { key: "PROCESSING_FAILED", label: "Processing Failed" },
  { key: "IN_PROCESS", label: "In Process Orders" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "PAYMENT_FAILED", label: "Payment Failed" },
];

const STATUS_BADGE: Record<Bucket, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-gray-100 text-gray-600" },
  NEW_READY_STOCK: { label: "New (Ready Stock)", className: "bg-[#c6e1c6] text-[#5b841b]" },
  NEW_PREORDER: { label: "New (Pre-order)", className: "bg-[#f0dab3] text-[#8a5a1f]" },
  PROCESSING_FAILED: { label: "Processing Failed", className: "bg-red-100 text-red-700" },
  IN_PROCESS: { label: "In Process", className: "bg-[#c8d7e1] text-[#2e4453]" },
  SHIPPED: { label: "Shipped", className: "bg-[#c8d7e1] text-[#2e4453]" },
  REFUNDED: { label: "Refunded", className: "bg-purple-100 text-purple-700" },
  PAYMENT_FAILED: { label: "Payment Failed", className: "bg-gray-200 text-gray-500" },
};

const ACTIONABLE: Bucket[] = ["NEW_READY_STOCK", "NEW_PREORDER", "PROCESSING_FAILED", "IN_PROCESS"];
const REFUNDABLE: Bucket[] = ["IN_PROCESS", "SHIPPED"];

function formatRM(sen: number | null | undefined) {
  if (sen == null) return "-";
  return `RM ${(sen / 100).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

/** Single-order refund button + confirmation modal. */
function RefundButton({ order }: { order: { id: string; jumlahSen: number } }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((order.jumlahSen / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const refundSen = Math.round(parseFloat(amount) * 100);
      const res = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, refundSen, refundReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error processing refund.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="text-[11px] underline text-red-600"
      >
        Refund
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div className="bg-white rounded-md p-5 w-full max-w-sm text-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Refund Order</h3>
            <label className="block text-xs font-semibold text-brand-dark/60 mb-1">Refund Amount (RM)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={(order.jumlahSen / 100).toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-brand-dark/20 rounded-sm px-3 py-2 mb-3 text-sm"
            />
            <label className="block text-xs font-semibold text-brand-dark/60 mb-1">Refund Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-brand-dark/20 rounded-sm px-3 py-2 mb-3 text-sm"
              placeholder="e.g. damaged item, customer cancelled, insufficient stock"
            />
            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} disabled={loading} className="text-sm px-4 py-2 text-brand-dark/60">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="bg-red-600 text-white text-sm font-semibold rounded-sm px-4 py-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Single order table + status tabs (WooCommerce/Dashify style) that
 * replaces the old separate sections. Each "bucket" (tab) carries its own
 * bulk action set since each stage needs a different operation (process /
 * retry / print AWB), not just a status label like the original WooCommerce.
 *
 * Stage flow mirrors the packing SOP: New Orders (Ready Stock / Pre-order)
 * -> In Process Orders (print AWB, then staff manually confirms) -> Shipped.
 */
export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [tab, setTab] = useState<Bucket | "ALL">("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) c[o.bucket] = (c[o.bucket] || 0) + 1;
    return c;
  }, [orders]);

  const visible = tab === "ALL" ? orders : orders.filter((o) => o.bucket === tab);
  const showToolbar = tab !== "ALL" && ACTIONABLE.includes(tab as Bucket);

  function switchTab(t: Bucket | "ALL") {
    setTab(t);
    setSelected([]);
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAllVisible() {
    setSelected(visible.slice(0, MAX_BULK).map((o) => o.id));
  }

  async function handleProcess() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      const data = await res.json();
      const failed = (data.results || []).filter((r: any) => !r.success);
      if (failed.length > 0) {
        alert(`${failed.length} order(s) failed to process (see "Processing Failed" tab for details).`);
      }
      const successIds = (data.results || []).filter((r: any) => r.success).map((r: any) => r.id);
      if (successIds.length > 0) {
        router.push(`/admin/orders/packing-slip?ids=${successIds.join(",")}`);
      } else {
        setSelected([]);
        router.refresh();
      }
    } catch (e) {
      alert("Error processing orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      const data = await res.json();
      const stillFailed = (data.results || []).filter((r: any) => !r.success);
      const success = (data.results || []).filter((r: any) => r.success);
      if (stillFailed.length > 0) {
        alert(`${success.length} succeeded, ${stillFailed.length} still failed. Please check the latest error message.`);
      }
      setSelected([]);
      router.refresh();
    } catch (e) {
      alert("Error retrying processing. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (selected.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/orders/export-easyparcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      if (!res.ok) throw new Error("Failed to generate file");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `easyparcel-manual-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error generating export file. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function handlePrintAwb() {
    if (selected.length === 0) return;
    router.push(`/admin/orders/packing-slip?ids=${selected.join(",")}`);
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-brand-dark/10 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-dark/10 text-xs overflow-x-auto">
        {TAB_DEF.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold transition-colors ${
              tab === t.key ? "bg-brand-dark text-white" : "text-brand-dark/50 hover:text-brand-dark"
            }`}
          >
            {t.label} ({counts[t.key] || 0})
          </button>
        ))}
      </div>

      {showToolbar && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-brand-dark/10 bg-brand-cream/40">
          <button type="button" onClick={selectAllVisible} className="text-xs underline text-brand-gold">
            Select All (max {MAX_BULK})
          </button>
          <button type="button" onClick={() => setSelected([])} className="text-xs underline text-brand-dark/50">
            Clear Selection
          </button>
          <div className="ml-auto flex gap-2">
            {tab === "PROCESSING_FAILED" && (
              <button
                type="button"
                onClick={handleExport}
                disabled={selected.length === 0 || exporting}
                className="bg-white border border-brand-dark/20 text-brand-dark font-semibold text-xs rounded-sm px-3 py-2 disabled:opacity-50"
              >
                {exporting ? "Generating..." : `DOWNLOAD CSV (${selected.length})`}
              </button>
            )}
            {(tab === "NEW_READY_STOCK" || tab === "NEW_PREORDER") && (
              <button
                type="button"
                onClick={handleProcess}
                disabled={selected.length === 0 || loading}
                className="bg-brand-gold text-brand-dark font-semibold text-xs rounded-sm px-3 py-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : `PROCESS ORDER (${selected.length})`}
              </button>
            )}
            {tab === "PROCESSING_FAILED" && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={selected.length === 0 || loading}
                className="bg-brand-gold text-brand-dark font-semibold text-xs rounded-sm px-3 py-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : `RETRY PROCESSING (${selected.length})`}
              </button>
            )}
            {tab === "IN_PROCESS" && (
              <button
                type="button"
                onClick={handlePrintAwb}
                disabled={selected.length === 0}
                className="bg-brand-gold text-brand-dark font-semibold text-xs rounded-sm px-3 py-2 disabled:opacity-50"
              >
                PRINT AWB ({selected.length})
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "PROCESSING_FAILED" && (
        <p className="px-5 pt-3 text-[11px] text-brand-dark/50">
          "RETRY PROCESSING" is safe to click repeatedly for orders that already have an EasyParcel
          order number - it does NOT create a new booking. If it keeps failing, use "DOWNLOAD CSV" to
          upload manually in the EasyParcel dashboard.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-brand-dark/70">
          <thead className="bg-white border-b border-brand-dark/10 text-brand-dark/50 font-medium">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Order</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Address</th>
              <th className="p-4">Items</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-dark/5">
            {visible.map((o) => {
              const badge = STATUS_BADGE[o.bucket];
              const selectable = ACTIONABLE.includes(o.bucket) && tab === o.bucket;
              return (
                <tr key={o.id} className="hover:bg-brand-cream/20 transition-colors align-top">
                  <td className="p-4">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selected.includes(o.id)}
                        onChange={() => toggle(o.id)}
                        className="rounded border-brand-dark/30"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-brand-dark">
                      #{o.seq} {o.namaPembeli}
                    </p>
                    <p className="text-brand-dark/40">{formatRM(o.jumlahSen)}</p>
                  </td>
                  <td className="p-4 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4 max-w-[14rem]">
                    {o.poskod}, {o.bandar}, {o.negeri}
                  </td>
                  <td className="p-4 max-w-[16rem]">
                    {o.items.map((it) => `${it.nama} x${it.kuantiti}`).join(", ")}
                  </td>
                  <td className="p-4 max-w-[12rem]">
                    {o.bucket === "PROCESSING_FAILED" && o.fulfillmentError && (
                      <p className="text-red-600 text-[11px]">{o.fulfillmentError}</p>
                    )}
                    {(o.courierName || o.trackingNumber) && (
                      <p className="text-brand-dark/50 text-[11px]">
                        {o.courierName} — {o.trackingNumber}
                      </p>
                    )}
                    {REFUNDABLE.includes(o.bucket) && (
                      <div className="mt-1">
                        <RefundButton order={o} />
                      </div>
                    )}
                    {o.bucket === "REFUNDED" && (
                      <div className="text-[11px] text-brand-dark/50 space-y-0.5">
                        <p>{formatRM(o.refundSen)}</p>
                        {o.refundReason && <p>{o.refundReason}</p>}
                        <p>{formatDate(o.refundedAt)}</p>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-6 text-center text-brand-dark/40 text-sm">No orders in this category.</p>
        )}
      </div>
    </div>
  );
}
