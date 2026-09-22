"use client";

import StatusPemilikanBadge from "@/components/geran/StatusPemilikanBadge";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_GERAN_LABEL,
  SUMBER_GERAN_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;
type Status = keyof typeof STATUS_GERAN_LABEL;
type Sumber = keyof typeof SUMBER_GERAN_LABEL;

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
  statusPemilikan: string;
  keluasan: number;
  unitKeluasan: string;
  hargaDimintaSen: number | null;
  hargaAmbilSen: number | null;
  hargaSiaranSen: number | null;
  keterangan: string | null;
  gambarUrls: string[];
  adaSalinanGeran: boolean;
  sumber: Sumber;
  status: Status;
  catatanAdmin: string | null;
  createdAt: string;
};

const TAB_DEF: { key: Status; label: string }[] = [
  { key: "MENUNGGU_SEMAKAN", label: "Pending" },
  { key: "DALAM_RUNDINGAN", label: "Negotiating" },
  { key: "DISAHKAN", label: "Approved" },
  { key: "DITOLAK", label: "Rejected" },
];

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DALAM_RUNDINGAN: "bg-blue-50 text-blue-700 border border-blue-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

const SUMBER_BADGE: Record<Sumber, string> = {
  PLT: "bg-[#0E3B2E]/[0.07] text-[#0E3B2E] border border-[#0E3B2E]/15",
  KJ_LAND: "bg-blue-50 text-blue-700 border border-blue-200",
  PENGGUNA: "bg-black/[0.04] text-brand-dark/60 border border-black/10",
};

const SUMBER_FILTER: ("ALL" | Sumber)[] = ["ALL", "PLT", "KJ_LAND", "PENGGUNA"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

const harga = (sen: number | null) => (sen === null ? "—" : formatRM(sen));

// Margin hanya bermakna bila kedua-dua harga ambil & siaran dah diisi.
function margin(g: GeranAdminRow): number | null {
  if (g.hargaAmbilSen === null || g.hargaSiaranSen === null) return null;
  return g.hargaSiaranSen - g.hargaAmbilSen;
}

export default function GeranAdminTable({ rows }: { rows: GeranAdminRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>("MENUNGGU_SEMAKAN");
  const [sumberAktif, setSumberAktif] = useState<"ALL" | Sumber>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Penapis sumber dikira dulu supaya bilangan pada setiap tab padan dengan
  // apa yang betul-betul dipapar.
  const bySumber = rows.filter((r) => sumberAktif === "ALL" || r.sumber === sumberAktif);
  const visible = bySumber.filter((r) => r.status === tab);
  const counts = TAB_DEF.reduce<Record<Status, number>>((acc, t) => {
    acc[t.key] = bySumber.filter((r) => r.status === t.key).length;
    return acc;
  }, {} as Record<Status, number>);

  useEffect(() => {
    setSelected(new Set());
  }, [tab, sumberAktif]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === bolehSiar.length ? new Set() : new Set(bolehSiar.map((r) => r.id))));
  }

  async function updateStatus(geranId: string, status: Status, opts?: { catatanAdmin?: string }) {
    const res = await fetch("/api/geran-admin/geran/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geranId, status, catatanAdmin: opts?.catatanAdmin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
  }

  async function handleSingleAction(geranId: string, status: Status, opts?: { catatanAdmin?: string }) {
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

  // Siarkan pukal hanya untuk yang dah ada harga siaran - yang lain akan
  // ditolak pelayan.
  const bolehSiar = visible.filter((r) => r.hargaSiaranSen !== null);
  const allSelected = bolehSiar.length > 0 && selected.size === bolehSiar.length;

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

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-brand-dark/45 mr-1">Sumber:</span>
        {SUMBER_FILTER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSumberAktif(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              sumberAktif === s
                ? "bg-brand-dark text-white"
                : "bg-black/[0.05] text-brand-dark/60 hover:bg-black/[0.08]"
            }`}
          >
            {s === "ALL" ? "Semua" : SUMBER_GERAN_LABEL[s]} (
            {s === "ALL" ? rows.length : rows.filter((r) => r.sumber === s).length})
          </button>
        ))}
      </div>

      {(tab === "MENUNGGU_SEMAKAN" || tab === "DALAM_RUNDINGAN") && bolehSiar.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-brand-cream/50 border border-brand-dark/10 rounded-md px-4 py-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 mr-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select All ({bolehSiar.length} sedia siar)
          </label>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading || selected.size === 0}
            className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
          >
            {bulkLoading ? "MEMPROSES..." : `SIARKAN (${selected.size})`}
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
                  {(tab === "MENUNGGU_SEMAKAN" || tab === "DALAM_RUNDINGAN") && g.hargaSiaranSen !== null && (
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${SUMBER_BADGE[g.sumber]}`}>
                    {SUMBER_GERAN_LABEL[g.sumber]}
                  </span>
                  <StatusPemilikanBadge status={g.statusPemilikan} />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[g.status]}`}>
                    {STATUS_GERAN_LABEL[g.status]}
                  </span>
                </div>
              </div>

              <p className="text-sm text-brand-dark/80 mb-1">{formatKeluasan(g.keluasan, g.unitKeluasan)}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-3 text-xs">
                <span className="text-brand-dark/50">
                  Diminta: <span className="font-semibold text-brand-dark/75">{harga(g.hargaDimintaSen)}</span>
                </span>
                <span className="text-brand-dark/50">
                  Ambil: <span className="font-semibold text-brand-dark/75">{harga(g.hargaAmbilSen)}</span>
                </span>
                <span className="text-brand-dark/50">
                  Siaran: <span className="font-bold text-brand-gold text-sm">{harga(g.hargaSiaranSen)}</span>
                </span>
                {margin(g) !== null && (
                  <span className="font-semibold text-emerald-700">Margin: {formatRM(margin(g)!)}</span>
                )}
              </div>

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

              {g.adaSalinanGeran ? (
                <a
                  href={`/api/geran-admin/salinan-geran/${g.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark bg-brand-cream/70 border border-brand-dark/15 rounded-sm px-2.5 py-1.5 mb-3"
                >
                  📄 Salinan penuh geran (PDF) →
                </a>
              ) : (
                <p className="text-xs text-brand-dark/40 mb-3">Tiada salinan geran dilampirkan.</p>
              )}

              {g.status === "DITOLAK" && g.catatanAdmin && (
                <p className="text-xs text-red-600 mt-2">Rejection reason: {g.catatanAdmin}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                <Link
                  href={`/geran/admin/geran/${g.id}`}
                  className="border border-brand-dark/25 text-brand-dark text-xs font-semibold rounded-sm px-3 py-1.5"
                >
                  HARGA & MEDIA
                </Link>

                {g.status === "MENUNGGU_SEMAKAN" && (
                  <button
                    onClick={() => handleSingleAction(g.id, "DALAM_RUNDINGAN")}
                    disabled={loadingId === g.id}
                    className="border border-blue-300 text-blue-700 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    MULA RUNDING
                  </button>
                )}

                {(g.status === "MENUNGGU_SEMAKAN" || g.status === "DALAM_RUNDINGAN") && (
                  <>
                    <button
                      onClick={() => handleSingleAction(g.id, "DISAHKAN")}
                      disabled={loadingId === g.id || g.hargaSiaranSen === null}
                      title={g.hargaSiaranSen === null ? "Set harga siaran dahulu" : undefined}
                      className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                    >
                      SIARKAN
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === g.id ? null : g.id)}
                      disabled={loadingId === g.id}
                      className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                    >
                      REJECT
                    </button>
                  </>
                )}
              </div>

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
