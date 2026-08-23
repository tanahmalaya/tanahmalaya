"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type OrderPrintView = {
  id: string;
  seq: number;
  namaPembeli: string;
  alamat: string;
  poskod: string;
  bandar: string;
  negeri: string;
  trackingNumber: string | null;
  courierName: string | null;
  items: { nama: string; kuantiti: number }[];
};

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
          {done ? "SELESAI ✓" : "SELESAI CETAK & PACK"}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Senarai Packing — {orders.length} Pesanan</h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div key={o.id} className="border border-brand-dark/20 rounded-md p-4 break-inside-avoid">
            <p className="font-bold text-lg">#{o.seq}</p>
            <p className="font-semibold">{o.namaPembeli}</p>
            <p className="text-sm text-brand-dark/70">
              {o.alamat}, {o.poskod} {o.bandar}, {o.negeri}
            </p>
            <p className="text-sm mt-1">
              <strong>Kurier:</strong> {o.courierName} — <strong>Tracking:</strong> {o.trackingNumber}
            </p>
            <div className="mt-2 border-t border-brand-dark/10 pt-2">
              <p className="text-sm font-semibold mb-1">Barang untuk dipek:</p>
              <ul className="text-sm list-disc list-inside">
                {o.items.map((it, i) => (
                  <li key={i}>
                    {it.nama} × {it.kuantiti}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
