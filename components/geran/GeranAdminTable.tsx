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
type StatusDrone = "TIDAK_BERKAITAN" | "MENUNGGU_PILOT" | "DIJADUALKAN" | "SELESAI";

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
  mintaDroneSurvey: boolean;
  statusDroneSurvey: StatusDrone;
  status: Status;
  catatanAdmin: string | null;
  createdAt: string;
  sellerIsRen: boolean;
  assignedRenNama: string | null;
};

const TAB_DEF: { key: Status; label: string }[] = [
  { key: "MENUNGGU_SEMAKAN", label: "Menunggu" },
  { key: "DISAHKAN", label: "Disahkan" },
  { key: "DITOLAK", label: "Ditolak" },
];

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

const DRONE_LABEL: Record<StatusDrone, string> = {
  TIDAK_BERKAITAN: "-",
  MENUNGGU_PILOT: "Menunggu Pilot",
  DIJADUALKAN: "Dijadualkan",
  SELESAI: "Selesai",
};

const DRONE_NEXT: Partial<Record<StatusDrone, StatusDrone>> = {
  MENUNGGU_PILOT: "DIJADUALKAN",
  DIJADUALKAN: "SELESAI",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function GeranAdminTable({
  rows,
  renOptions,
}: {
  rows: GeranAdminRow[];
  renOptions: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>("MENUNGGU_SEMAKAN");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedRenId, setSelectedRenId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const visible = rows.filter((r) => r.status === tab);
  // Bulk approve hanya untuk penyenaraian REN sendiri (tak perlu pilih REN
  // pilihan PLT) - penjual biasa kena lalu alur approve satu-satu supaya
  // admin pilih REN dahulu.
  const bulkSelectable = visible.filter((r) => r.sellerIsRen);
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
    setSelected((prev) => (prev.size === bulkSelectable.length ? new Set() : new Set(bulkSelectable.map((r) => r.id))));
  }

  async function updateStatus(geranId: string, status: "DISAHKAN" | "DITOLAK", opts?: { catatanAdmin?: string; renId?: string }) {
    const res = await fetch("/api/admin/geran/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geranId, status, catatanAdmin: opts?.catatanAdmin, renId: opts?.renId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal kemaskini status");
  }

  async function handleSingleAction(geranId: string, status: "DISAHKAN" | "DITOLAK", opts?: { catatanAdmin?: string; renId?: string }) {
    setLoadingId(geranId);
    try {
      await updateStatus(geranId, status, opts);
      setRejectingId(null);
      setRejectReason("");
      setAssigningId(null);
      setSelectedRenId("");
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

  async function handleDroneAdvance(geranId: string, next: StatusDrone) {
    setLoadingId(geranId);
    try {
      const res = await fetch("/api/admin/geran/update-drone-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geranId, statusDroneSurvey: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal kemaskini status drone");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  const allSelected = bulkSelectable.length > 0 && selected.size === bulkSelectable.length;

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

      {tab === "MENUNGGU_SEMAKAN" && bulkSelectable.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-brand-cream/50 border border-brand-dark/10 rounded-md px-4 py-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 mr-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select All (REN sahaja)
          </label>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading || selected.size === 0}
            className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
          >
            {bulkLoading ? "MEMPROSES..." : `SAHKAN (${selected.size})`}
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-brand-dark/50 text-sm">Tiada penyenaraian dalam kategori ini.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((g) => (
            <div key={g.id} className="bg-white border border-brand-dark/10 rounded-md p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div className="flex items-start gap-3">
                  {tab === "MENUNGGU_SEMAKAN" && g.sellerIsRen && (
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
                    {g.sellerIsRen ? (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        🏢 Penjual REN sendiri
                      </span>
                    ) : g.assignedRenNama ? (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                        REN pilihan PLT: {g.assignedRenNama}
                      </span>
                    ) : null}
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
                  <span className="text-brand-dark/40">Penjual:</span> {g.namaPenjual}
                </p>
                <p>
                  <span className="text-brand-dark/40">Telefon:</span> {g.telefonPenjual}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-brand-dark/40">E-mel:</span> {g.emelPenjual}
                </p>
                {(g.nomborLot || g.nomborGeran) && (
                  <p className="sm:col-span-2">
                    <span className="text-brand-dark/40">Lot/Geran:</span> {g.nomborLot || "-"} / {g.nomborGeran || "-"}
                  </p>
                )}
              </div>

              {g.keterangan && <p className="text-sm text-brand-dark/70 mb-3">{g.keterangan}</p>}

              {g.gambarUrls.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {g.gambarUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-brand-gold">
                      Gambar →
                    </a>
                  ))}
                </div>
              )}

              {g.mintaDroneSurvey && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 text-xs text-blue-700">
                  <span className="font-semibold">📹 Drone Survey: {DRONE_LABEL[g.statusDroneSurvey]}</span>
                  {DRONE_NEXT[g.statusDroneSurvey] && (
                    <button
                      onClick={() => handleDroneAdvance(g.id, DRONE_NEXT[g.statusDroneSurvey]!)}
                      disabled={loadingId === g.id}
                      className="ml-auto bg-blue-600 text-white text-[11px] font-semibold rounded-sm px-2.5 py-1 disabled:opacity-50"
                    >
                      Tanda: {DRONE_LABEL[DRONE_NEXT[g.statusDroneSurvey]!]}
                    </button>
                  )}
                </div>
              )}

              {g.status === "DITOLAK" && g.catatanAdmin && (
                <p className="text-xs text-red-600 mt-2">Sebab ditolak: {g.catatanAdmin}</p>
              )}

              {g.status === "MENUNGGU_SEMAKAN" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                  <button
                    onClick={() =>
                      g.sellerIsRen
                        ? handleSingleAction(g.id, "DISAHKAN")
                        : setAssigningId(assigningId === g.id ? null : g.id)
                    }
                    disabled={loadingId === g.id}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    SAHKAN
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === g.id ? null : g.id)}
                    disabled={loadingId === g.id}
                    className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    TOLAK
                  </button>
                </div>
              )}

              {assigningId === g.id && (
                <div className="mt-3 pt-3 border-t border-brand-dark/10">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">
                    Pilih REN pilihan PLT untuk uruskan penyenaraian ni
                  </label>
                  <select
                    value={selectedRenId}
                    onChange={(e) => setSelectedRenId(e.target.value)}
                    className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                  >
                    <option value="">Pilih REN...</option>
                    {renOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                  {renOptions.length === 0 && (
                    <p className="text-xs text-red-600 mb-2">
                      Tiada REN disahkan lagi - sahkan sekurang-kurangnya satu permohonan di /admin/ren dahulu.
                    </p>
                  )}
                  <button
                    onClick={() => handleSingleAction(g.id, "DISAHKAN", { renId: selectedRenId })}
                    disabled={loadingId === g.id || !selectedRenId}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    SAHKAN & TETAPKAN REN
                  </button>
                </div>
              )}

              {rejectingId === g.id && (
                <div className="mt-3 pt-3 border-t border-brand-dark/10">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Sebab ditolak</label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                    placeholder="Contoh: Maklumat lot tidak lengkap"
                  />
                  <button
                    onClick={() => handleSingleAction(g.id, "DITOLAK", { catatanAdmin: rejectReason })}
                    disabled={loadingId === g.id || !rejectReason.trim()}
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
