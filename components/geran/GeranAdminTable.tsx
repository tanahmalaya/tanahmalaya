"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_GERAN_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;
type Status = keyof typeof STATUS_GERAN_LABEL;

export type GeranAdminRow = {
  id: string;
  seq: number;
  namaPenjual: string;
  telefonPenjual: string;
  emelPenjual: string;
  tajuk: string;
  negeri: string;
  daerahMukim: string;
  nomborLot: string | null;
  nomborGeran: string | null;
  jenisTanah: JenisTanah;
  jenisHakmilik: JenisHakmilik;
  keluasan: number;
  unitKeluasan: string;
  hargaSen: number;
  keterangan: string | null;
  gambarUrls: string[];
  status: Status;
  catatanAdmin: string | null;
  createdAt: string;
};

const TAB_DEF: { key: Status; label: string }[] = [
  { key: "MENUNGGU_SEMAKAN", label: "Pending" },
  { key: "DISAHKAN", label: "Approved" },
  { key: "DITOLAK", label: "Rejected" },
];

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function GeranAdminTable({ rows }: { rows: GeranAdminRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>("MENUNGGU_SEMAKAN");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const visible = rows.filter((r) => r.status === tab);
  const counts = TAB_DEF.reduce<Record<Status, number>>((acc, t) => {
    acc[t.key] = rows.filter((r) => r.status === t.key).length;
    return acc;
  }, {} as Record<Status, number>);

  useEffect(() => {
    setSelected(new Set());
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
    setSelected((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((r) => r.id))));
  }

  async function updateStatus(geranId: string, status: "DISAHKAN" | "DITOLAK", opts?: { catatanAdmin?: string }) {
    const res = await fetch("/api/geran-admin/geran/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geranId, status, catatanAdmin: opts?.catatanAdmin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
  }

  async function handleSingleAction(geranId: string, status: "DISAHKAN" | "DITOLAK", opts?: { catatanAdmin?: string }) {
    setLoadingId(geranId);
    try {
      await updateStatus(geranId, status, opts);
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleBulkApprove() {
    setBulkLoading(true);
    try {
      for (const id of selected) {
        // eslint-disable-next-line no-await-in-loop
        await updateStatus(id, "DISAHKAN");
      }
      setSelected(new Set());
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

      {tab === "MENUNGGU_SEMAKAN" && visible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-brand-cream/50 border border-brand-dark/10 rounded-md px-4 py-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 mr-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select All
          </label>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading || selected.size === 0}
            className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
          >
            {bulkLoading ? "PROCESSING..." : `APPROVE (${selected.size})`}
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-brand-dark/50 text-sm">No listings in this category.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((g) => (
            <div key={g.id} className="bg-white border border-brand-dark/10 rounded-md p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div className="flex items-start gap-3">
                  {tab === "MENUNGGU_SEMAKAN" && (
                    <input type="checkbox" className="mt-1" checked={selected.has(g.id)} onChange={() => toggleSelected(g.id)} />
                  )}
                  <div>
                    <p className="font-semibold">
                      #{g.seq} — {g.tajuk}
                    </p>
                    <p className="text-xs text-brand-dark/50">
                      {g.daerahMukim}, {g.negeri} · {JENIS_TANAH_LABEL[g.jenisTanah]} · {JENIS_HAKMILIK_LABEL[g.jenisHakmilik]} ·{" "}
                      {formatDate(g.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[g.status]}`}>
                  {STATUS_GERAN_LABEL[g.status]}
                </span>
              </div>

              <p className="text-sm text-brand-dark/80 mb-1">{formatKeluasan(g.keluasan, g.unitKeluasan)}</p>
              <p className="font-bold text-brand-gold mb-3">{formatRM(g.hargaSen)}</p>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-brand-dark/60 mb-3">
                <p>
                  <span className="text-brand-dark/40">Seller:</span> {g.namaPenjual}
                </p>
                <p>
                  <span className="text-brand-dark/40">Phone:</span> {g.telefonPenjual}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-brand-dark/40">Email:</span> {g.emelPenjual}
                </p>
                {(g.nomborLot || g.nomborGeran) && (
                  <p className="sm:col-span-2">
                    <span className="text-brand-dark/40">Lot/Grant:</span> {g.nomborLot || "-"} / {g.nomborGeran || "-"}
                  </p>
                )}
              </div>

              {g.keterangan && <p className="text-sm text-brand-dark/70 mb-3">{g.keterangan}</p>}

              {g.gambarUrls.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {g.gambarUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-brand-gold">
                      Photo →
                    </a>
                  ))}
                </div>
              )}

              {g.status === "DITOLAK" && g.catatanAdmin && (
                <p className="text-xs text-red-600 mt-2">Rejection reason: {g.catatanAdmin}</p>
              )}

              {g.status === "MENUNGGU_SEMAKAN" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                  <button
                    onClick={() => handleSingleAction(g.id, "DISAHKAN")}
                    disabled={loadingId === g.id}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === g.id ? null : g.id)}
                    disabled={loadingId === g.id}
                    className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    REJECT
                  </button>
                </div>
              )}

              {rejectingId === g.id && (
                <div className="mt-3 pt-3 border-t border-brand-dark/10">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Rejection reason</label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                    placeholder="e.g. Lot details incomplete"
                  />
                  <button
                    onClick={() => handleSingleAction(g.id, "DITOLAK", { catatanAdmin: rejectReason })}
                    disabled={loadingId === g.id || !rejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    CONFIRM REJECT
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
