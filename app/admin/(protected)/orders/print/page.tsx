"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type OrderPrintView = {
  id: string;
  seq: number;
  createdAt: string;
  status: "MENUNGGU" | "BERJAYA" | "GAGAL";
  namaPembeli: string;
  emel: string;
  telefon: string;
  alamat: string;
  poskod: string;
  bandar: string;
  negeri: string;
  trackingNumber: string | null;
  courierName: string | null;
  bayarcashRef: string | null;
  jumlahKecilSen: number;
  shippingSen: number;
  jumlahSen: number;
  items: { nama: string; kuantiti: number; hargaSen: number; subjumlahSen: number }[];
};

const STATUS_LABEL: Record<OrderPrintView["status"], string> = {
  MENUNGGU: "Menunggu Bayaran",
  BERJAYA: "Bayaran Berjaya",
  GAGAL: "Bayaran Gagal",
};

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTarikh(iso: string) {
  return new Date(iso).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PrintOrdersPage() {
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
      <div className="flex items-center gap-3 mb-6 print:hidden">
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
      </div>

      <h1 className="text-2xl font-bold mb-6 print:hidden">
        Invois Pesanan — {orders.length} Pesanan
      </h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border border-brand-dark/20 rounded-md p-6 break-inside-avoid print:break-after-page"
          >
            {/* Header invois */}
            <div className="flex justify-between items-start border-b border-brand-dark/10 pb-3 mb-3">
              <div>
                <p className="font-bold text-lg">Invois #{o.seq}</p>
                <p className="text-sm text-brand-dark/70">Tarikh: {formatTarikh(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{STATUS_LABEL[o.status]}</p>
                {o.bayarcashRef && (
                  <p className="text-xs text-brand-dark/60">Ruj. Bayaran: {o.bayarcashRef}</p>
                )}
              </div>
            </div>

            {/* Pelanggan & alamat */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold text-brand-dark/60 uppercase mb-1">Pelanggan</p>
                <p className="font-semibold">{o.namaPembeli}</p>
                <p className="text-sm text-brand-dark/70">{o.emel}</p>
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

            {/* Kurier & tracking - papar hanya jika sudah ada (bukan dari EasyParcel di sini) */}
            {(o.courierName || o.trackingNumber) && (
              <p className="text-sm mb-3">
                <strong>Kurier:</strong> {o.courierName || "-"} —{" "}
                <strong>Tracking:</strong> {o.trackingNumber || "-"}
              </p>
            )}

            {/* Jadual item */}
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="border-b border-brand-dark/20 text-left">
                  <th className="py-1 font-semibold">Produk</th>
                  <th className="py-1 font-semibold text-center">Kuantiti</th>
                  <th className="py-1 font-semibold text-right">Harga Seunit</th>
                  <th className="py-1 font-semibold text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it, i) => (
                  <tr key={i} className="border-b border-brand-dark/5">
                    <td className="py-1">{it.nama}</td>
                    <td className="py-1 text-center">{it.kuantiti}</td>
                    <td className="py-1 text-right">{formatRM(it.hargaSen)}</td>
                    <td className="py-1 text-right">{formatRM(it.subjumlahSen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Jumlah keseluruhan */}
            <div className="flex justify-end">
              <div className="w-56 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-brand-dark/70">Jumlah Kecil</span>
                  <span>{formatRM(o.jumlahKecilSen)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-dark/70">Penghantaran</span>
                  <span>{formatRM(o.shippingSen)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-brand-dark/20 pt-1">
                  <span>Jumlah Keseluruhan</span>
                  <span>{formatRM(o.jumlahSen)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
