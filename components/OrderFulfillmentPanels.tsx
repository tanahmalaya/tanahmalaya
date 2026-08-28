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
  jumlahSen: number;
  createdAt?: string;
  refundSen?: number | null;
  refundReason?: string | null;
  refundedAt?: string | null;
};

const MAX_BULK = 30;

function formatRM(sen: number | null | undefined) {
  if (sen == null) return "-";
  return `RM ${(sen / 100).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTarikh(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Butang + modal ringkas untuk refund SATU order. Simpan sendiri state
 * (open/loading/error) supaya boleh terus digunakan dalam mana-mana panel
 * (Sudah Fulfill, Selesai) tanpa perlu angkat state ke page.tsx (server
 * component).
 */
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
        setError(data.error || "Ralat semasa proses refund.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError("Ralat rangkaian. Sila cuba lagi.");
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
        className="text-xs underline text-red-600 shrink-0"
      >
        Refund
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-white rounded-md p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">Refund Order</h3>
            <label className="block text-xs font-semibold text-brand-dark/60 mb-1">Jumlah Refund (RM)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={(order.jumlahSen / 100).toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-brand-dark/20 rounded-sm px-3 py-2 mb-3 text-sm"
            />
            <label className="block text-xs font-semibold text-brand-dark/60 mb-1">Sebab Refund</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-brand-dark/20 rounded-sm px-3 py-2 mb-3 text-sm"
              placeholder="cth: barang rosak, pelanggan batal, stok tak cukup"
            />
            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="text-sm px-4 py-2 text-brand-dark/60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="bg-red-600 text-white text-sm font-semibold rounded-sm px-4 py-2 disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Sahkan Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      // Bawa ke laman slip pembungkusan (tanpa harga) untuk yang BERJAYA -
      // ni yang staff packing guna untuk bungkus barang.
      const successIds = (data.results || []).filter((r: any) => r.success).map((r: any) => r.id);
      if (successIds.length > 0) {
        router.push(`/admin/orders/packing-slip?ids=${successIds.join(",")}`);
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
  const router = useRouter();

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAll() {
    setSelected(orders.map((o) => o.id));
  }

  function handlePrint() {
    if (selected.length === 0) return;
    router.push(`/admin/orders/packing-slip?ids=${selected.join(",")}`);
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
          CETAK SLIP PEMBUNGKUSAN ({selected.length})
        </button>
      </div>

      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex items-start gap-3 bg-white rounded-md shadow-sm p-4">
            <label className="flex items-start gap-3 flex-1 cursor-pointer">
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
            <RefundButton order={o} />
          </div>
        ))}
        {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order sedia untuk dicetak.</p>}
      </div>
    </div>
  );
}

export function GagalFulfillPanel({ orders }: { orders: OrderView[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAll() {
    setSelected(orders.slice(0, MAX_BULK).map((o) => o.id));
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
      const berjaya = (data.results || []).filter((r: any) => r.success);
      if (stillFailed.length > 0) {
        alert(
          `${berjaya.length} berjaya, ${stillFailed.length} masih gagal. Sila semak mesej ralat terkini untuk order yang masih gagal.`
        );
      }
      setSelected([]);
      router.refresh();
    } catch (e) {
      alert("Ralat semasa cuba fulfill semula. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Muat turun senarai order yang dipilih dalam format CSV yang sepadan
  // dengan template "Bulk Single Pick Up" EasyParcel, untuk Tuan upload
  // MANUAL terus dalam dashboard EasyParcel bila API automatik gagal/
  // tak boleh dipercayai buat sementara.
  async function handleExport() {
    if (selected.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/orders/export-easyparcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      if (!res.ok) throw new Error("Gagal jana fail");
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
      alert("Ralat semasa jana fail eksport. Sila cuba lagi.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={selectAll} className="text-sm underline text-brand-gold">
          Pilih Semua (maks {MAX_BULK})
        </button>
        <button onClick={() => setSelected([])} className="text-sm underline text-brand-dark/50">
          Buang Pilihan
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            disabled={selected.length === 0 || exporting}
            className="bg-white border border-brand-dark/20 text-brand-dark font-semibold text-sm rounded-sm px-4 py-2 disabled:opacity-50"
          >
            {exporting ? "Menjana..." : `MUAT TURUN CSV (${selected.length})`}
          </button>
          <button
            onClick={handleRetry}
            disabled={selected.length === 0 || loading}
            className="bg-brand-gold text-brand-dark font-semibold text-sm rounded-sm px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : `CUBA FULFILL SEMULA (${selected.length})`}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {orders.map((o) => (
          <label
            key={o.id}
            className="flex items-start gap-3 bg-white rounded-md shadow-sm p-4 cursor-pointer border border-red-200"
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
              <p className="text-red-600 text-xs mt-1">{o.fulfillmentError}</p>
            </div>
          </label>
        ))}
        {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order gagal fulfill.</p>}
      </div>

      <p className="text-brand-dark/50 text-xs mt-3">
        "CUBA FULFILL SEMULA" kini SELAMAT ditekan berulang kali untuk order yang dah ada order_number
        EasyParcel - ia TIDAK akan cipta booking baru, cuma cuba proses bayaran/semak status order sedia
        ada untuk tarik tracking number. Kalau ia asyik gagal, guna "MUAT TURUN CSV" untuk dapatkan fail
        yang boleh Tuan upload MANUAL dalam dashboard EasyParcel (Bulk Order Upload) - buka fail tu,
        copy baris-baris (bukan header) ke dalam template rasmi EasyParcel Tuan, semak semula
        berat/dimensi bungkusan, baru upload.
      </p>
    </div>
  );
}

/** Senarai ringkas, baca-sahaja - tiada tindakan diperlukan daripada staff. */
export function MenungguBayaranPanel({ orders }: { orders: OrderView[] }) {
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-md shadow-sm p-4 text-sm opacity-80">
          <p className="font-semibold">
            #{o.seq} — {o.namaPembeli}
          </p>
          <p className="text-brand-dark/60">
            {o.poskod}, {o.bandar}, {o.negeri} — {formatRM(o.jumlahSen)}
          </p>
          <p className="text-brand-dark/40 text-xs mt-1">
            Belum bayar ({formatTarikh(o.createdAt)}) - tiada tindakan fulfillment diperlukan.
          </p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order menunggu bayaran.</p>}
    </div>
  );
}

/** Senarai ringkas, baca-sahaja - untuk rujukan/customer service, bukan fulfillment. */
export function GagalBayaranPanel({ orders }: { orders: OrderView[] }) {
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-md shadow-sm p-4 text-sm opacity-60">
          <p className="font-semibold">
            #{o.seq} — {o.namaPembeli}
          </p>
          <p className="text-brand-dark/60">{formatRM(o.jumlahSen)} — {formatTarikh(o.createdAt)}</p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order gagal bayar.</p>}
    </div>
  );
}

/** Order yang dah dicetak & dipos (status SELESAI). Boleh refund dari sini. */
export function SelesaiPanel({ orders }: { orders: OrderView[] }) {
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-md shadow-sm p-4 text-sm flex items-start justify-between gap-3">
          <div className="opacity-70">
            <p className="font-semibold">
              #{o.seq} — {o.namaPembeli}
            </p>
            <p className="text-brand-dark/60">
              {o.courierName} — {o.trackingNumber}
            </p>
          </div>
          <RefundButton order={o} />
        </div>
      ))}
      {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada lagi.</p>}
    </div>
  );
}

/** Order yang dah direfund - papar jumlah, sebab dan tarikh. */
export function DipulangkanPanel({ orders }: { orders: OrderView[] }) {
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-md shadow-sm p-4 text-sm border border-brand-dark/10">
          <p className="font-semibold">
            #{o.seq} — {o.namaPembeli}
          </p>
          <p className="text-brand-dark/60">Jumlah refund: {formatRM(o.refundSen)}</p>
          {o.refundReason && <p className="text-brand-dark/60">Sebab: {o.refundReason}</p>}
          <p className="text-brand-dark/40 text-xs mt-1">Tarikh refund: {formatTarikh(o.refundedAt)}</p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-brand-dark/50 text-sm">Tiada order dipulangkan.</p>}
    </div>
  );
}
