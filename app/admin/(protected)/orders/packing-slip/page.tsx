"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  courierName: string | null;
  items: { nama: string; kuantiti: number }[];
};

function formatTarikh(iso: string) {
  return new Date(iso).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Slip pembungkusan - SENGAJA TIADA HARGA. Ni yang staff packing guna untuk
 * bungkus & tampal dalam kotak, supaya harga tak terdedah kepada sesiapa
 * yang buka parcel. Untuk invois penuh (dengan harga, untuk rekod/akaun),
 * guna laman "/admin/orders/print".
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

  async function handleDonePrint() {
    await fetch("/api/admin/orders/mark-printed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: ids }),
    });
    setDone(true);
    setTimeout(() => router.push("/admin/orders"), 1500);
  }

  if (loading) return <div className="p-8">Memuatkan...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 print:hidden flex-wrap">
        <button
          onClick={() => window.print()}
          className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-5 py-2"
        >
          CETAK (PDF)
        </button>
        <button
          onClick={handleDonePrint}
          disabled={done}
          className="bg-brand-dark text-white font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {done ? "SELESAI ✓" : "SELESAI CETAK"}
        </button>
        <Link
          href={`/admin/orders/print?ids=${ids.join(",")}`}
          className="text-sm underline text-brand-dark/60 ml-auto"
        >
          Lihat Invois Penuh (dengan harga) →
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6 print:hidden">
        Slip Pembungkusan — {orders.length} Pesanan
      </h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border border-brand-dark/20 rounded-md p-6 break-inside-avoid print:break-after-page"
          >
            <div className="flex justify-between items-start border-b border-brand-dark/10 pb-3 mb-3">
              <div>
                <p className="font-bold text-lg">Pesanan #{o.seq}</p>
                <p className="text-sm text-brand-dark/70">Tarikh: {formatTarikh(o.createdAt)}</p>
              </div>
              {(o.courierName || o.trackingNumber) && (
                <div className="text-right text-sm">
                  <p className="font-semibold">{o.courierName || "-"}</p>
                  <p className="text-brand-dark/60">{o.trackingNumber || "-"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">Pelanggan</p>
                <p className="font-semibold">{o.namaPembeli}</p>
                <p className="text-sm text-brand-dark/70">{o.telefon}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">
                  Alamat Penghantaran
                </p>
                <p className="text-sm text-brand-dark/70">
                  {o.alamat}, {o.poskod} {o.bandar}, {o.negeri}
                </p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-dark/20 text-left">
                  <th className="py-1 font-semibold">Produk</th>
                  <th className="py-1 font-semibold text-right">Kuantiti</th>
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
