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

// Vercel Blob simpan nama fail asal, jadi sambungan fail cukup untuk bezakan
// imej (boleh preview terus) dengan PDF (kena buka tab baru).
const IMEJ_EXT = /\.(jpe?g|png|webp|gif)$/i;

/**
 * Resit yang ahli attach. Admin kena tengok bukti ni sebelum luluskan
 * tuntutan, jadi imej dipapar terus sebagai thumbnail (klik = saiz penuh)
 * dan bukan sekadar link kecil yang senang terlepas pandang.
 */
function ResitPreview({ url }: { url: string }) {
  const isImej = IMEJ_EXT.test(url.split("?")[0]);

  return (
    <div className="flex items-center gap-2">
      {isImej && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Resit"
            loading="lazy"
            className="h-14 w-14 object-cover rounded-sm border border-brand-dark/15 hover:opacity-80 transition-opacity"
          />
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-brand-dark border border-brand-dark/20 rounded-sm px-2 py-1 hover:bg-brand-cream"
      >
        {isImej ? "Lihat Resit" : "Lihat Resit (PDF)"} →
      </a>
    </div>
  );
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
  const [menuTabTerbuka, setMenuTabTerbuka] = useState(false);

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
      {/*
        Empat tab ni (~500px) lebih lebar dari skrin telefon (~340px), jadi
        dulu tab terakhir "Dibayar" terkeluar skrin tanpa sebarang petunjuk.
        Pada mobile ia jadi pemilih yang tertutup - tekan baru senarai penuh
        semua status terbuka. Dari sm ke atas, baris tab biasa kekal.
      */}
      <div className="sm:hidden relative mb-5">
        <button
          type="button"
          onClick={() => setMenuTabTerbuka((v) => !v)}
          aria-expanded={menuTabTerbuka}
          className="w-full flex items-center justify-between bg-white border border-brand-dark/15 rounded-md px-4 py-3 text-sm font-semibold text-brand-dark"
        >
          <span>
            {TAB_DEF.find((t) => t.key === tab)?.label} ({counts[tab]})
          </span>
          <span className={`text-brand-dark/40 text-xs transition-transform ${menuTabTerbuka ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {menuTabTerbuka && (
          <>
            {/* Tekan di luar senarai = tutup semula */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuTabTerbuka(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-brand-dark/15 rounded-md shadow-lg overflow-hidden">
              {TAB_DEF.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setMenuTabTerbuka(false);
                  }}
                  className={`w-full flex items-center justify-between text-left px-4 py-3 text-sm font-semibold border-b border-brand-dark/5 last:border-b-0 ${
                    tab === t.key ? "bg-brand-cream text-brand-dark" : "text-brand-dark/60"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-brand-dark/40">{counts[t.key]}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="hidden sm:flex gap-1 mb-5 border-b border-brand-dark/10 overflow-x-auto">
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

      {/*
        Susun atur jadual sama macam dashboard Orders: satu bekas putih,
        toolbar bulk di atas, dan jadual yang slide ke tepi bila lajur tak
        muat (skrin kecil) - bukan lagi kad berasingan setiap tuntutan.
      */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-brand-dark/10 overflow-hidden">
        {actionable && visible.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-brand-dark/10 bg-brand-cream/40">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-brand-dark/70">
            <thead className="bg-white border-b border-brand-dark/10 text-brand-dark/50 font-medium">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">Tuntutan</th>
                <th className="p-4">Tarikh</th>
                <th className="p-4">Status</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Tujuan</th>
                <th className="p-4">Akaun Bank</th>
                <th className="p-4">Resit</th>
                <th className="p-4">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5">
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-brand-cream/20 transition-colors align-top">
                  <td className="p-4">
                    {actionable && (
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelected(c.id)}
                        className="rounded border-brand-dark/30"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-brand-dark whitespace-nowrap">
                      #{c.seq} {c.namaPemohon}
                    </p>
                    <p className="text-brand-dark/40">{c.memberNo}</p>
                    <p className="font-semibold text-brand-gold mt-0.5">{formatRM(c.jumlahSen)}</p>
                  </td>
                  <td className="p-4 whitespace-nowrap">{formatDate(c.tarikhPerbelanjaan)}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${STATUS_BADGE[c.status]}`}>
                      {TAB_DEF.find((t) => t.key === c.status)?.label}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">{KATEGORI_LABEL[c.kategori]}</td>
                  <td className="p-4 min-w-[12rem] max-w-[16rem]">{c.tujuan}</td>
                  <td className="p-4 max-w-[11rem]">
                    <p className="text-brand-dark/80">{c.bankName}</p>
                    <p>{c.accountNo}</p>
                    <p className="text-brand-dark/50">{c.accountHolder}</p>
                  </td>
                  <td className="p-4">
                    {c.resitUrl ? (
                      <ResitPreview url={c.resitUrl} />
                    ) : (
                      <span className="text-brand-dark/40 whitespace-nowrap">Tiada resit</span>
                    )}
                  </td>
                  <td className="p-4 max-w-[14rem]">
                    {c.status === "MENUNGGU" && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSingleAction(c.id, "DILULUSKAN")}
                          disabled={loadingId === c.id}
                          className="bg-brand-dark text-white text-[11px] font-semibold rounded-sm px-2.5 py-1.5 disabled:opacity-50"
                        >
                          LULUSKAN
                        </button>
                        <button
                          onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}
                          disabled={loadingId === c.id}
                          className="border border-red-300 text-red-600 text-[11px] font-semibold rounded-sm px-2.5 py-1.5 disabled:opacity-50"
                        >
                          TOLAK
                        </button>
                      </div>
                    )}

                    {c.status === "DILULUSKAN" && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSingleAction(c.id, "DIBAYAR")}
                          disabled={loadingId === c.id}
                          className="bg-brand-dark text-white text-[11px] font-semibold rounded-sm px-2.5 py-1.5 disabled:opacity-50"
                        >
                          TANDA DIBAYAR
                        </button>
                        <button
                          onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}
                          disabled={loadingId === c.id}
                          className="border border-red-300 text-red-600 text-[11px] font-semibold rounded-sm px-2.5 py-1.5 disabled:opacity-50"
                        >
                          TOLAK
                        </button>
                      </div>
                    )}

                    {rejectingId === c.id && (
                      <div className="mt-2">
                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full min-w-[11rem] text-[11px] border border-brand-dark/20 rounded-sm p-2 mb-1.5"
                          placeholder="Sebab ditolak (dihantar ke ahli)"
                        />
                        <button
                          onClick={() => handleSingleAction(c.id, "DITOLAK", rejectReason)}
                          disabled={loadingId === c.id || !rejectReason.trim()}
                          className="bg-red-600 text-white text-[11px] font-semibold rounded-sm px-2.5 py-1.5 disabled:opacity-50"
                        >
                          SAHKAN TOLAK
                        </button>
                      </div>
                    )}

                    {c.status === "DITOLAK" && c.catatanAdmin && (
                      <p className="text-red-600 text-[11px]">Sebab ditolak: {c.catatanAdmin}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="p-6 text-center text-brand-dark/40 text-sm">Tiada tuntutan dalam kategori ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
