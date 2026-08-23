"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderItemView = { nama: string; kuantiti: number };
type OrderView = {
  id: string;
  seq: number;
  namaPembeli: string;
  poskod: string;
  bandar: string;
  negeri: string;
  trackingNumber: string | null;
  courierName: string | null;
  fulfillmentError: string | null;
  items: OrderItemView[];
};

const MAX_BULK = 30;

export function BelumFulfillPanel({ orders }: { orders: OrderView[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAll() {
    setSelected(orders.slice(0, MAX_BULK).map((o) => o.id));
  }

  async function handleFulfill() {
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
        alert(`${failed.length} order gagal fulfill (lihat bahagian "Gagal Fulfill" untuk butiran).`);
      }
      // Bawa ke laman cetak untuk yang BERJAYA
      const successIds = (data.results || []).filter((r: any) => r.success).map((r: any) => r.id);
      if (successIds.length > 0) {
        router.push(`/admin/orders/print?ids=${successIds.join(",")}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      alert("Ralat semasa fulfill. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={selectAll} className="text-sm underline text-brand-gold">
          Pilih Semua (maks {MAX_BULK})
        </button>
        <button onClick={() => setSelected([])} className="text-sm underline text-brand-dark/50">
          Buang Pilihan
        </button>
        <button
          onClick={handleFulfill}
          disabled={selected.length === 0 || loading}
          className="ml-auto bg-brand-gold text-brand-dark font-semibold text-sm rounded-sm px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Memproses..." : `FULFILL (${selected.length})`}
        </button>
      </div>

      <div className="space-y-2">
        {orders.map((o) => (
          <label
            key={o.id}
            className="flex items-start gap-3 bg-white rounded-md shadow-sm p-4 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)}
              className="mt-1"
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                #{o.seq} — {o.namaPembeli}
              </p>
              <p className="text-brand-dark/60">
                {o.poskod}, {o.bandar}, {o.negeri}
              </p>
              <p className="text-brand-dark/70 mt-1">
                {o.items.map((it) => `${it.nama} x${it.kuantiti}`).join(", ")}
              </p>
            </div>
          </label>
        ))}
        {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order menunggu fulfill.</p>}
      </div>
    </div>
  );
}

export function SudahFulfillPanel({ orders }: { orders: OrderView[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAll() {
    setSelected(orders.map((o) => o.id));
  }

  function handlePrint() {
    if (selected.length === 0) return;
    router.push(`/admin/orders/print?ids=${selected.join(",")}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={selectAll} className="text-sm underline text-brand-gold">
          Pilih Semua
        </button>
        <button onClick={() => setSelected([])} className="text-sm underline text-brand-dark/50">
          Buang Pilihan
        </button>
        <button
          onClick={handlePrint}
          disabled={selected.length === 0}
          className="ml-auto bg-brand-gold text-brand-dark font-semibold text-sm rounded-sm px-4 py-2 disabled:opacity-50"
        >
          CETAK SENARAI ({selected.length})
        </button>
      </div>

      <div className="space-y-2">
        {orders.map((o) => (
          <label
            key={o.id}
            className="flex items-start gap-3 bg-white rounded-md shadow-sm p-4 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)}
              className="mt-1"
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                #{o.seq} — {o.namaPembeli}
              </p>
              <p className="text-brand-dark/60">
                {o.courierName} — {o.trackingNumber}
              </p>
              <p className="text-brand-dark/70 mt-1">
                {o.items.map((it) => `${it.nama} x${it.kuantiti}`).join(", ")}
              </p>
            </div>
          </label>
        ))}
        {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order sedia untuk dicetak.</p>}
      </div>
    </div>
  );
}
