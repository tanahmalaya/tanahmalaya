"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Kategori = "PENGANGKUTAN" | "ALAT_TULIS" | "PROGRAM_AKTIVITI" | "LAIN_LAIN";
type Status = "MENUNGGU" | "DILULUSKAN" | "DITOLAK" | "DIBAYAR";

export type ClaimRow = {
  id: string;
  seq: number;
  namaPemohon: string;
  memberNo: string;
  jumlahSen: number;
  kategori: Kategori;
  tujuan: string;
  tarikhPerbelanjaan: string;
  resitUrl: string | null;
  bankName: string;
  accountNo: string;
  accountHolder: string;
  status: Status;
  catatanAdmin: string | null;
  createdAt: string;
};

const KATEGORI_LABEL: Record<Kategori, string> = {
  PENGANGKUTAN: "Pengangkutan",
  ALAT_TULIS: "Alat Tulis",
  PROGRAM_AKTIVITI: "Program / Aktiviti",
  LAIN_LAIN: "Lain-lain",
};

const TAB_DEF: { key: Status; label: string }[] = [
  { key: "MENUNGGU", label: "Menunggu" },
  { key: "DILULUSKAN", label: "Diluluskan" },
  { key: "DITOLAK", label: "Ditolak" },
  { key: "DIBAYAR", label: "Dibayar" },
];

// Tab yang ada tindakan (lulus/tolak/bayar) - hanya tab ni ada checkbox
// pilih & Select All, sebab DITOLAK/DIBAYAR dah status akhir (tiada tindakan).
const ACTIONABLE_TABS: Status[] = ["MENUNGGU", "DILULUSKAN"];

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU: "bg-amber-50 text-amber-700 border border-amber-200",
  DILULUSKAN: "bg-blue-50 text-blue-700 border border-blue-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
  DIBAYAR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PettyCashClaimsTable({ claims }: { claims: ClaimRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>("MENUNGGU");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const visible = claims.filter((c) => c.status === tab);
  const counts = TAB_DEF.reduce<Record<Status, number>>((acc, t) => {
    acc[t.key] = claims.filter((c) => c.status === t.key).length;
    return acc;
  }, {} as Record<Status, number>);
  const actionable = ACTIONABLE_TABS.includes(tab);

  // Kosongkan pilihan bila tukar tab supaya tak "bawa" selection merentasi
  // status yang berlainan tindakan.
  useEffect(() => {
    setSelected(new Set());
    setBulkRejecting(false);
    setBulkRejectReason("");
  }, [tab]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((c) => c.id))));
  }

  async function updateStatus(claimId: string, status: "DILULUSKAN" | "DITOLAK" | "DIBAYAR", catatanAdmin?: string) {
    const res = await fetch("/api/admin/petty-cash/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, status, catatanAdmin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal kemaskini status");
  }

  async function handleSingleAction(claimId: string, status: "DILULUSKAN" | "DITOLAK" | "DIBAYAR", catatanAdmin?: string) {
    setLoadingId(claimId);
    try {
      await updateStatus(claimId, status, catatanAdmin);
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleBulkAction(status: "DILULUSKAN" | "DITOLAK" | "DIBAYAR", catatanAdmin?: string) {
    setBulkLoading(true);
    try {
      for (const claimId of selected) {
        // eslint-disable-next-line no-await-in-loop
        await updateStatus(claimId, status, catatanAdmin);
      }
      setSelected(new Set());
      setBulkRejecting(false);
      setBulkRejectReason("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBulkLoading(false);
    }
  }

  const allSelected = visible.length > 0 && selected.size === visible.length;

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-brand-dark/10 overflow-x-auto">
        {TAB_DEF.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-brand-gold text-brand-dark" : "border-transparent text-brand-dark/50 hover:text-brand-dark"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {actionable && visible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-brand-cream/50 border border-brand-dark/10 rounded-md px-4 py-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 mr-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select All
          </label>

          {tab === "MENUNGGU" && (
            <button
              onClick={() => handleBulkAction("DILULUSKAN")}
              disabled={bulkLoading || selected.size === 0}
              className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
            >
              {bulkLoading ? "MEMPROSES..." : `LULUSKAN (${selected.size})`}
            </button>
          )}
          {tab === "DILULUSKAN" && (
            <button
              onClick={() => handleBulkAction("DIBAYAR")}
              disabled={bulkLoading || selected.size === 0}
              className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
            >
              {bulkLoading ? "MEMPROSES..." : `TANDA DIBAYAR (${selected.size})`}
            </button>
          )}
          <button
            onClick={() => setBulkRejecting((v) => !v)}
            disabled={bulkLoading || selected.size === 0}
            className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
          >
            {`TOLAK (${selected.size})`}
          </button>

          {bulkRejecting && (
            <div className="w-full mt-1">
              <textarea
                rows={2}
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                placeholder="Sebab ditolak (akan dihantar ke setiap ahli yang dipilih)"
              />
              <button
                onClick={() => handleBulkAction("DITOLAK", bulkRejectReason)}
                disabled={bulkLoading || !bulkRejectReason.trim()}
                className="bg-red-600 text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
              >
                SAHKAN TOLAK ({selected.size})
              </button>
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-brand-dark/50 text-sm">Tiada tuntutan dalam kategori ini.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <div key={c.id} className="bg-white border border-brand-dark/10 rounded-md p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div className="flex items-start gap-3">
                  {actionable && (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelected(c.id)}
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      #{c.seq} — {c.namaPemohon} <span className="text-brand-dark/40 font-normal text-sm">({c.memberNo})</span>
                    </p>
                    <p className="text-xs text-brand-dark/50">
                      {KATEGORI_LABEL[c.kategori]} · {formatDate(c.tarikhPerbelanjaan)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[c.status]}`}>
                  {TAB_DEF.find((t) => t.key === c.status)?.label}
                </span>
              </div>

              <p className="text-sm text-brand-dark/80 mb-2">{c.tujuan}</p>
              <p className="font-bold text-brand-gold mb-3">{formatRM(c.jumlahSen)}</p>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-brand-dark/60 mb-3">
                <p>
                  <span className="text-brand-dark/40">Bank:</span> {c.bankName}
                </p>
                <p>
                  <span className="text-brand-dark/40">No. Akaun:</span> {c.accountNo}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-brand-dark/40">Nama Pemegang Akaun:</span> {c.accountHolder}
                </p>
              </div>

              {c.resitUrl ? (
                <a href={c.resitUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-brand-gold">
                  Lihat resit →
                </a>
              ) : (
                <p className="text-xs text-brand-dark/40">Tiada resit dimuat naik.</p>
              )}

              {c.status === "DITOLAK" && c.catatanAdmin && (
                <p className="text-xs text-red-600 mt-2">Sebab ditolak: {c.catatanAdmin}</p>
              )}

              {c.status === "MENUNGGU" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                  <button
                    onClick={() => handleSingleAction(c.id, "DILULUSKAN")}
                    disabled={loadingId === c.id}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    LULUSKAN
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}
                    disabled={loadingId === c.id}
                    className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    TOLAK
                  </button>
                </div>
              )}

              {c.status === "DILULUSKAN" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                  <button
                    onClick={() => handleSingleAction(c.id, "DIBAYAR")}
                    disabled={loadingId === c.id}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    TANDA DIBAYAR
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}
                    disabled={loadingId === c.id}
                    className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    TOLAK
                  </button>
                </div>
              )}

              {rejectingId === c.id && (
                <div className="mt-3 pt-3 border-t border-brand-dark/10">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Sebab ditolak (akan dihantar ke ahli)</label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                    placeholder="Contoh: Perbelanjaan tidak berkaitan aktiviti PLT"
                  />
                  <button
                    onClick={() => handleSingleAction(c.id, "DITOLAK", rejectReason)}
                    disabled={loadingId === c.id || !rejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    SAHKAN TOLAK
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
