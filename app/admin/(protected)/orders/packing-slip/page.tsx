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
  const [menyediakanPdf, setMenyediakanPdf] = useState(false);
  // Menarik AWB dari EasyParcel ambil masa beberapa saat (lagi banyak order,
  // lagi lama). Tanpa sebarang tanda, butang nampak macam tergantung - jadi
  // kita kira saat berlalu supaya staff tahu ia memang sedang berjalan.
  const [saatBerlalu, setSaatBerlalu] = useState(0);

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

  const sedangSibuk = menyediakanPdf;

  useEffect(() => {
    if (!sedangSibuk) {
      setSaatBerlalu(0);
      return;
    }
    const mula = Date.now();
    const timer = setInterval(() => setSaatBerlalu(Math.round((Date.now() - mula) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [sedangSibuk]);

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

  /**
   * Buka AWB yang dipilih sebagai SATU PDF dalam tab baru - staff cetak
   * dari viewer PDF di situ (Ctrl+P, paper size A6).
   *
   * Kenapa bukan window.print() terus: AWB ialah PDF yang dihoskan di
   * server EasyParcel (cross-origin). Browser tak boleh render isi PDF
   * cross-origin masa cetak, jadi window.print() pada page ni cuma
   * menghasilkan preview kecil viewer + header/footer laman - bukan label
   * yang boleh guna. Label sebenar mesti ditarik & digabung di server
   * (lihat /api/admin/orders/awb-proxy) dahulu.
   *
   * Pendekatan iframe tersembunyi + contentWindow.print() pernah digunakan
   * di sini, tapi ia rapuh (event afterprint selalu tak muncul, jadi butang
   * tersekat sampai timeout 8s) dan tak bagi staff peluang semak label
   * sebelum cetak. Tab baru lebih mudah diramal.
   */
  async function handleOpenAwbPdf() {
    const targets = orders.filter((o) => o.awbUrl && selected.has(o.id));
    if (targets.length === 0) return;
    // Tab dibuka SERENTAK dengan klik - kalau dibuka selepas await, popup
    // blocker akan sekat ia.
    const tab = window.open("", "_blank");
    setMenyediakanPdf(true);
    try {
      const res = await fetch(`/api/admin/orders/awb-proxy?orderIds=${targets.map((o) => o.id).join(",")}`);
      if (!res.ok) {
        tab?.close();
        alert("Gagal ambil AWB daripada EasyParcel. Sila cuba lagi.");
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = blobUrl;
      } else {
        // Popup disekat - muat turun sebagai fail supaya staff tak buntu.
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `awb-${targets.map((o) => o.seq).join("-")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      // Jangan revoke serta-merta - tab baru tu masih perlukan blob URL.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (e) {
      tab?.close();
      alert("Ralat rangkaian semasa ambil AWB. Sila cuba lagi.");
    } finally {
      setMenyediakanPdf(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const selectedPrintableCount = orders.filter((o) => o.awbUrl && selected.has(o.id)).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-3 print:hidden flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-brand-dark/70 mr-1">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Select All
        </label>
        <button
          onClick={handleOpenAwbPdf}
          disabled={menyediakanPdf || selectedPrintableCount === 0}
          className="bg-brand-gold text-brand-dark text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
        >
          {menyediakanPdf
            ? `PREPARING ${selectedPrintableCount} AWB... ${saatBerlalu}s`
            : `PRINT AWB (${selectedPrintableCount})`}
        </button>
        <button
          onClick={() => markShipped(orders.filter((o) => selected.has(o.id)).map((o) => o.id))}
          disabled={done || selected.size === 0}
          className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
        >
          {done ? "SHIPPED ✓" : `MARK SELECTED AS SHIPPED (${selected.size})`}
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
                  // Lazy - preview di bawah skrin tak perlu berebut bandwidth
                  // dengan muat turun AWB masa staff tekan Bulk Print.
                  loading="lazy"
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
