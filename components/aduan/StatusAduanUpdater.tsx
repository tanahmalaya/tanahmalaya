"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "BAHARU", label: "Baharu" },
  { value: "DALAM_SEMAKAN", label: "Dalam Semakan" },
  { value: "SELESAI", label: "Selesai" },
];

export default function StatusAduanUpdater({
  id,
  status: statusAwal,
  notaAdmin: notaAwal,
}: {
  id: string;
  status: string;
  notaAdmin: string | null;
}) {
  const [status, setStatus] = useState(statusAwal);
  const [notaAdmin, setNotaAdmin] = useState(notaAwal || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function simpan() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/aduan-tanah/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notaAdmin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal simpan.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Ralat rangkaian. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-md shadow-sm p-5 space-y-3">
      <h3 className="font-semibold text-sm">Status & Nota Dalaman</h3>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm bg-white"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <textarea
        value={notaAdmin}
        onChange={(e) => setNotaAdmin(e.target.value)}
        rows={4}
        placeholder="Nota dalaman staff (tidak dipaparkan kepada pengadu)..."
        className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      {saved && !loading && <p className="text-green-700 text-xs">Disimpan.</p>}
      <button
        type="button"
        onClick={simpan}
        disabled={loading}
        className="bg-brand-gold text-brand-dark font-semibold text-sm rounded-sm px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "SIMPAN"}
      </button>
    </div>
  );
}
