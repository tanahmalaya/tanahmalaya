"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Kategori = "PENGANGKUTAN" | "ALAT_TULIS" | "PROGRAM_AKTIVITI" | "LAIN_LAIN";
type Status = "MENUNGGU" | "DILULUSKAN" | "DITOLAK" | "DIBAYAR";
type Tindakan = "DILULUSKAN" | "DITOLAK" | "DIBAYAR";

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
  updatedAt: string;
};

export type ClaimTab = "all" | "new" | "approved" | "rejected";
type SubBayaran = "semua" | "belum" | "dibayar";
type Susunan = "auto" | "baru" | "lama" | "tinggi" | "rendah";

const KATEGORI_LABEL: Record<Kategori, string> = {
  PENGANGKUTAN: "Pengangkutan",
  ALAT_TULIS: "Alat Tulis",
  PROGRAM_AKTIVITI: "Program / Aktiviti",
  LAIN_LAIN: "Lain-lain",
};

const STATUS_LABEL: Record<Status, string> = {
  MENUNGGU: "Baru",
  DILULUSKAN: "Diluluskan",
  DITOLAK: "Ditolak",
  DIBAYAR: "Dibayar",
};

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU: "bg-amber-50 text-amber-700 border border-amber-200",
  DILULUSKAN: "bg-blue-50 text-blue-700 border border-blue-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
  DIBAYAR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

// "Approved" merangkumi yang dah dibayar juga - bayaran ialah langkah
// terakhir selepas lulus, bukan kategori berasingan. Sub-penapis dalam tab
// tu yang bezakan "belum dibayar" dengan "dah dibayar".
const TAB_DEF: { key: ClaimTab; label: string; pendek: string; status: Status[]; aksen: string }[] = [
  { key: "all", label: "All Claim", pendek: "All", status: ["MENUNGGU", "DILULUSKAN", "DITOLAK", "DIBAYAR"], aksen: "bg-brand-dark" },
  { key: "new", label: "New Claim", pendek: "New", status: ["MENUNGGU"], aksen: "bg-amber-500" },
  { key: "approved", label: "Approved Claim", pendek: "Approved", status: ["DILULUSKAN", "DIBAYAR"], aksen: "bg-emerald-600" },
  { key: "rejected", label: "Rejected Claim", pendek: "Rejected", status: ["DITOLAK"], aksen: "bg-red-500" },
];

const SEBAB_TOLAK = [
  "Resit tidak jelas / tidak lengkap",
  "Tiada resit dilampirkan",
  "Jumlah tidak sepadan dengan resit",
  "Perbelanjaan bukan untuk urusan PLT",
  "Tuntutan pendua",
];

// Tuntutan baru yang tak disentuh seminggu dianggap tertunggak.
const HARI_TERTUNGGAK = 7;
const HARI_MS = 24 * 60 * 60 * 1000;

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hariSejak(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / HARI_MS));
}

function bulanKey(iso: string) {
  return iso.slice(0, 7); // yyyy-mm
}

function bulanLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ms-MY", { month: "long", year: "numeric" });
}

// Vercel Blob simpan nama fail asal, jadi sambungan fail cukup untuk bezakan
// imej (boleh preview terus) dengan PDF (kena buka tab baru).
const IMEJ_EXT = /\.(jpe?g|png|webp|gif)$/i;
const isImej = (url: string) => IMEJ_EXT.test(url.split("?")[0]);

function csvCell(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * CSV untuk rekod / pindahan bank manual. No akaun ditulis sebagai ="..."
 * supaya Excel & Google Sheets tak buang sifar di depan atau tukar ke 1.2E+11.
 */
function exportCsv(rows: ClaimRow[]) {
  const header = [
    "No Claim",
    "Tarikh Hantar",
    "Nama",
    "No Ahli",
    "Kategori",
    "Tujuan",
    "Tarikh Perbelanjaan",
    "Jumlah (RM)",
    "Bank",
    "No Akaun",
    "Pemegang Akaun",
    "Status",
    "Catatan Admin",
    "Resit",
  ];
  const lines = rows.map((c) =>
    [
      csvCell(`#${c.seq}`),
      csvCell(formatDate(c.createdAt)),
      csvCell(c.namaPemohon),
      csvCell(c.memberNo),
      csvCell(KATEGORI_LABEL[c.kategori]),
      csvCell(c.tujuan),
      csvCell(formatDate(c.tarikhPerbelanjaan)),
      (c.jumlahSen / 100).toFixed(2),
      csvCell(c.bankName),
      `="${c.accountNo.replace(/"/g, "")}"`,
      csvCell(c.accountHolder),
      csvCell(STATUS_LABEL[c.status]),
      csvCell(c.catatanAdmin ?? ""),
      csvCell(c.resitUrl ?? ""),
    ].join(",")
  );
  const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claim-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Toast = { id: number; text: string; tone: "ok" | "error" };

export default function PettyCashClaimsTable({ claims, initialTab = "new" }: { claims: ClaimRow[]; initialTab?: ClaimTab }) {
  const router = useRouter();

  // Salinan tempatan supaya status bertukar serta-merta selepas tindakan,
  // sementara router.refresh() ambil data sebenar dari server.
  const [rows, setRows] = useState(claims);
  useEffect(() => setRows(claims), [claims]);

  const [tab, setTab] = useState<ClaimTab>(initialTab);
  const [subBayaran, setSubBayaran] = useState<SubBayaran>("semua");
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState<Kategori | "">("");
  const [bulan, setBulan] = useState("");
  const [susunan, setSusunan] = useState<Susunan>("auto");
  const [penapisTerbuka, setPenapisTerbuka] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string[] | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(text: string, tone: Toast["tone"] = "ok") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  // Tab disimpan dalam URL (?tab=) supaya refresh / kongsi link kekal di tab sama.
  // Langkau render pertama: URL dah sepadan dengan initialTab, dan router
  // Next belum sedia pada ketika itu - replaceState awal akan ditimpa semula
  // oleh router.refresh() kemudian.
  const tabMula = useRef(true);
  useEffect(() => {
    if (tabMula.current) {
      tabMula.current = false;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
    setSelected(new Set());
    setSubBayaran("semua");
  }, [tab]);

  const tabDef = TAB_DEF.find((t) => t.key === tab)!;

  // Pengesanan pendua: ahli sama, jumlah sama, tarikh perbelanjaan sama.
  // Tuntutan yang ditolak tak dikira supaya hantar semula selepas ditolak
  // tak ditanda sebagai pendua.
  const pendua = useMemo(() => {
    const byKey = new Map<string, ClaimRow[]>();
    for (const c of rows) {
      if (c.status === "DITOLAK") continue;
      const key = `${c.memberNo}|${c.jumlahSen}|${c.tarikhPerbelanjaan.slice(0, 10)}`;
      byKey.set(key, [...(byKey.get(key) ?? []), c]);
    }
    const map = new Map<string, number[]>();
    for (const group of byKey.values()) {
      if (group.length < 2) continue;
      for (const c of group) map.set(c.id, group.filter((x) => x.id !== c.id).map((x) => x.seq));
    }
    return map;
  }, [rows]);

  const senaraiBulan = useMemo(
    () => Array.from(new Set(rows.map((c) => bulanKey(c.tarikhPerbelanjaan)))).sort().reverse(),
    [rows]
  );

  const stats = useMemo(() => {
    const s = Object.fromEntries(TAB_DEF.map((t) => [t.key, { count: 0, sen: 0 }])) as Record<ClaimTab, { count: number; sen: number }>;
    let tertunggak = 0;
    let belumBayarSen = 0;
    let belumBayarCount = 0;
    let dibayarBulanIniSen = 0;
    const bulanIni = bulanKey(new Date().toISOString());
    for (const c of rows) {
      for (const t of TAB_DEF) {
        if (t.status.includes(c.status)) {
          s[t.key].count++;
          s[t.key].sen += c.jumlahSen;
        }
      }
      if (c.status === "MENUNGGU" && hariSejak(c.createdAt) >= HARI_TERTUNGGAK) tertunggak++;
      if (c.status === "DILULUSKAN") {
        belumBayarSen += c.jumlahSen;
        belumBayarCount++;
      }
      if (c.status === "DIBAYAR" && bulanKey(c.updatedAt) === bulanIni) dibayarBulanIniSen += c.jumlahSen;
    }
    return { tab: s, tertunggak, belumBayarSen, belumBayarCount, dibayarBulanIniSen };
  }, [rows]);

  function ikutPaparan(c: ClaimRow) {
    if (!tabDef.status.includes(c.status)) return false;
    if (tab === "approved" && subBayaran === "belum" && c.status !== "DILULUSKAN") return false;
    if (tab === "approved" && subBayaran === "dibayar" && c.status !== "DIBAYAR") return false;
    if (kategori && c.kategori !== kategori) return false;
    if (bulan && bulanKey(c.tarikhPerbelanjaan) !== bulan) return false;
    const q = cari.trim().toLowerCase().replace(/^#/, "");
    if (q) {
      const hay = `${c.seq} ${c.namaPemohon} ${c.memberNo} ${c.tujuan} ${c.accountHolder}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  // Tab New ikut giliran (paling lama dulu); tab lain paling baru dulu.
  const susunanEfektif: Exclude<Susunan, "auto"> = susunan === "auto" ? (tab === "new" ? "lama" : "baru") : susunan;

  const visible = rows
    .filter(ikutPaparan)
    .sort((a, b) => {
      if (susunanEfektif === "tinggi") return b.jumlahSen - a.jumlahSen;
      if (susunanEfektif === "rendah") return a.jumlahSen - b.jumlahSen;
      const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return susunanEfektif === "lama" ? d : -d;
    });

  const visibleSen = visible.reduce((sum, c) => sum + c.jumlahSen, 0);
  const selectable = visible.filter((c) => c.status === "MENUNGGU" || c.status === "DILULUSKAN");
  const allSelected = selectable.length > 0 && selectable.every((c) => selected.has(c.id));
  const selectedRows = rows.filter((c) => selected.has(c.id));
  const selectedSen = selectedRows.reduce((sum, c) => sum + c.jumlahSen, 0);
  const selMenunggu = selectedRows.filter((c) => c.status === "MENUNGGU");
  const selDiluluskan = selectedRows.filter((c) => c.status === "DILULUSKAN");
  const penapisAktif = [kategori, bulan, susunan !== "auto" ? susunan : ""].filter(Boolean).length;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((c) => c.id)));
  }

  async function updateStatus(claimId: string, status: Tindakan, catatanAdmin?: string) {
    const res = await fetch("/api/admin/petty-cash/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, status, catatanAdmin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Gagal kemaskini status");
  }

  /**
   * Satu laluan untuk tindakan tunggal & pukal. Diproses satu-satu (setiap
   * satu hantar emel ke ahli), dan yang gagal tak hentikan yang lain -
   * hujungnya dilaporkan berapa berjaya / gagal.
   */
  async function jalankan(ids: string[], status: Tindakan, catatanAdmin?: string) {
    if (ids.length === 0) return;

    // Kalau claim yang sedang dibuka akan keluar dari paparan, terus ke
    // claim seterusnya - jadi admin boleh semak satu-satu tanpa tutup panel.
    let nextOpen: string | null | undefined;
    if (openId && ids.includes(openId)) {
      const idx = visible.findIndex((c) => c.id === openId);
      const baki = visible.filter((c) => !ids.includes(c.id));
      const selepas = visible.slice(idx + 1).find((c) => !ids.includes(c.id));
      nextOpen = selepas?.id ?? baki[baki.length - 1]?.id ?? null;
    }

    setBusyIds(new Set(ids));
    setProgress(ids.length > 1 ? { done: 0, total: ids.length } : null);
    const berjaya: string[] = [];
    const gagal: string[] = [];
    for (const id of ids) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await updateStatus(id, status, catatanAdmin);
        berjaya.push(id);
      } catch (err) {
        gagal.push(`#${rows.find((c) => c.id === id)?.seq}: ${(err as Error).message}`);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    const kini = new Date().toISOString();
    setRows((prev) =>
      prev.map((c) =>
        berjaya.includes(c.id)
          ? { ...c, status, updatedAt: kini, catatanAdmin: status === "DITOLAK" ? catatanAdmin ?? null : c.catatanAdmin }
          : c
      )
    );
    setSelected((prev) => new Set(Array.from(prev).filter((id) => !berjaya.includes(id))));
    setBusyIds(new Set());
    setProgress(null);
    setRejectTarget(null);

    if (nextOpen !== undefined && berjaya.includes(openId!)) {
      const tinggal = rows.find((c) => c.id === openId);
      const masihPapar = tinggal && ikutPaparan({ ...tinggal, status });
      if (!masihPapar) setOpenId(nextOpen);
    }

    const label = status === "DILULUSKAN" ? "diluluskan" : status === "DIBAYAR" ? "ditanda dibayar" : "ditolak";
    if (berjaya.length) toast(`${berjaya.length} claim ${label}. Emel dihantar ke ahli.`);
    if (gagal.length) toast(`Gagal (${gagal.length}): ${gagal.join("; ")}`, "error");
    router.refresh();
  }

  async function salin(teks: string, label: string) {
    try {
      await navigator.clipboard.writeText(teks);
      toast(`${label} disalin`);
    } catch {
      toast("Tak dapat salin - sila salin secara manual", "error");
    }
  }

  const openClaim = openId ? rows.find((c) => c.id === openId) ?? null : null;
  const openIdx = openClaim ? visible.findIndex((c) => c.id === openClaim.id) : -1;

  return (
    <div className="pb-4">
      {/* Ringkasan pantas di atas tab */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-dark/60 mb-4">
        <span>
          Belum dibayar: <b className="text-brand-dark">{formatRM(stats.belumBayarSen)}</b> ({stats.belumBayarCount})
        </span>
        <span>
          Dibayar bulan ini: <b className="text-brand-dark">{formatRM(stats.dibayarBulanIniSen)}</b>
        </span>
        {stats.tertunggak > 0 && (
          <button type="button" onClick={() => { setTab("new"); setSusunan("lama"); }} className="text-red-600 font-semibold">
            ⚠ {stats.tertunggak} claim baru menunggu ≥ {HARI_TERTUNGGAK} hari
          </button>
        )}
      </div>

      {/*
        Tab dalam bentuk kad: 2x2 di telefon (tiada tab yang terkeluar skrin),
        satu baris di skrin besar. Setiap kad tunjuk bilangan & jumlah RM.
      */}
      <div role="tablist" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {TAB_DEF.map((t) => {
          const aktif = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={aktif}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative text-left rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 transition-all overflow-hidden ${
                aktif
                  ? "bg-white border-brand-gold shadow-md ring-1 ring-brand-gold"
                  : "bg-white/60 border-brand-dark/10 hover:bg-white hover:border-brand-dark/20"
              }`}
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.aksen} ${aktif ? "" : "opacity-40"}`} />
              <span className="flex items-center justify-between gap-2">
                <span className={`text-xs sm:text-sm font-semibold ${aktif ? "text-brand-dark" : "text-brand-dark/60"}`}>
                  <span className="sm:hidden">{t.pendek}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
                {t.key === "new" && stats.tab.new.count > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                )}
              </span>
              <span className="block text-xl sm:text-2xl font-bold text-brand-dark leading-tight mt-0.5">{stats.tab[t.key].count}</span>
              <span className="block text-[11px] text-brand-dark/50 truncate">{formatRM(stats.tab[t.key].sen)}</span>
            </button>
          );
        })}
      </div>

      {/* Carian, penapis & export */}
      <div className="bg-white rounded-lg border border-brand-dark/10 shadow-sm mb-3">
        <div className="flex items-center gap-2 p-2 sm:p-3">
          <div className="relative flex-1 min-w-0">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark/40" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari no claim, nama, no ahli, tujuan…"
              className="w-full text-sm border border-brand-dark/15 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-brand-gold"
            />
          </div>
          <button
            type="button"
            onClick={() => setPenapisTerbuka((v) => !v)}
            aria-expanded={penapisTerbuka}
            className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold border rounded-md px-3 py-2 ${
              penapisTerbuka || penapisAktif ? "border-brand-gold text-brand-dark bg-brand-cream" : "border-brand-dark/15 text-brand-dark/70"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            <span className="hidden sm:inline">Penapis</span>
            {penapisAktif > 0 && (
              <span className="bg-brand-gold text-white text-[10px] rounded-full h-4 min-w-4 px-1 leading-4 text-center">{penapisAktif}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const data = selected.size ? selectedRows : visible;
              if (!data.length) return toast("Tiada claim untuk di-export", "error");
              exportCsv(data);
              toast(`${data.length} claim di-export ke CSV`);
            }}
            title={selected.size ? "Export claim yang dipilih" : "Export claim dalam paparan"}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold border border-brand-dark/15 text-brand-dark/70 rounded-md px-3 py-2 hover:bg-brand-cream"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {penapisTerbuka && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-2 pb-3 sm:px-3 border-t border-brand-dark/5 pt-3">
            <label className="text-[11px] font-semibold text-brand-dark/50">
              Kategori
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as Kategori | "")}
                className="mt-1 w-full text-sm font-normal text-brand-dark border border-brand-dark/15 rounded-md px-2 py-2 bg-white"
              >
                <option value="">Semua kategori</option>
                {(Object.keys(KATEGORI_LABEL) as Kategori[]).map((k) => (
                  <option key={k} value={k}>
                    {KATEGORI_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold text-brand-dark/50">
              Bulan perbelanjaan
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="mt-1 w-full text-sm font-normal text-brand-dark border border-brand-dark/15 rounded-md px-2 py-2 bg-white"
              >
                <option value="">Semua bulan</option>
                {senaraiBulan.map((b) => (
                  <option key={b} value={b}>
                    {bulanLabel(b)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold text-brand-dark/50">
              Susunan
              <select
                value={susunan}
                onChange={(e) => setSusunan(e.target.value as Susunan)}
                className="mt-1 w-full text-sm font-normal text-brand-dark border border-brand-dark/15 rounded-md px-2 py-2 bg-white"
              >
                <option value="auto">Automatik ({tab === "new" ? "paling lama dulu" : "paling baru dulu"})</option>
                <option value="baru">Paling baru</option>
                <option value="lama">Paling lama</option>
                <option value="tinggi">Jumlah tertinggi</option>
                <option value="rendah">Jumlah terendah</option>
              </select>
            </label>
            {penapisAktif > 0 && (
              <button
                type="button"
                onClick={() => {
                  setKategori("");
                  setBulan("");
                  setSusunan("auto");
                }}
                className="sm:col-span-3 justify-self-start text-xs font-semibold text-brand-gold"
              >
                Kosongkan penapis
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-penapis tab Approved: belum dibayar vs dah dibayar */}
      {tab === "approved" && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {(
            [
              ["semua", "Semua", stats.tab.approved.count],
              ["belum", "Belum Dibayar", stats.belumBayarCount],
              ["dibayar", "Dah Dibayar", stats.tab.approved.count - stats.belumBayarCount],
            ] as [SubBayaran, string, number][]
          ).map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSubBayaran(k)}
              className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 border ${
                subBayaran === k ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark/60 border-brand-dark/15"
              }`}
            >
              {label} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Baris maklumat paparan + pilih semua */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs text-brand-dark/50">
        <span>
          {visible.length} claim · {formatRM(visibleSen)}
        </span>
        {selectable.length > 0 && (
          <label className="flex items-center gap-1.5 font-semibold text-brand-dark/70 cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4" />
            Pilih semua ({selectable.length})
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-lg border border-brand-dark/10 p-10 text-center">
          <p className="text-3xl mb-2">{tab === "new" && !cari && !penapisAktif ? "🎉" : "📭"}</p>
          <p className="text-sm text-brand-dark/50">
            {tab === "new" && !cari && !penapisAktif ? "Semua claim baru dah diproses." : "Tiada claim yang sepadan."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: senarai kad */}
          <ul className="md:hidden space-y-2">
            {visible.map((c) => (
              <li key={c.id}>
                <ClaimKad
                  c={c}
                  pendua={pendua.get(c.id)}
                  selected={selected.has(c.id)}
                  busy={busyIds.has(c.id)}
                  onToggle={() => toggleSelected(c.id)}
                  onOpen={() => setOpenId(c.id)}
                />
              </li>
            ))}
          </ul>

          {/* Desktop: jadual */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-brand-dark/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-dark/70">
                <thead className="bg-brand-cream/40 border-b border-brand-dark/10 text-brand-dark/50 font-medium">
                  <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Claim</th>
                    <th className="p-3">Jumlah</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Kategori & Tujuan</th>
                    <th className="p-3">Tarikh</th>
                    <th className="p-3">Resit</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-dark/5">
                  {visible.map((c) => {
                    const boleh = c.status === "MENUNGGU" || c.status === "DILULUSKAN";
                    const busy = busyIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setOpenId(c.id)}
                        className={`cursor-pointer transition-colors align-top ${
                          selected.has(c.id) ? "bg-brand-gold/10" : "hover:bg-brand-cream/30"
                        } ${busy ? "opacity-50" : ""}`}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          {boleh && (
                            <input
                              type="checkbox"
                              checked={selected.has(c.id)}
                              onChange={() => toggleSelected(c.id)}
                              className="h-4 w-4 rounded border-brand-dark/30"
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-brand-dark whitespace-nowrap">
                            #{c.seq} {c.namaPemohon}
                          </p>
                          <p className="text-brand-dark/40">{c.memberNo}</p>
                          <AmaranChips c={c} pendua={pendua.get(c.id)} />
                        </td>
                        <td className="p-3 font-semibold text-brand-dark whitespace-nowrap">{formatRM(c.jumlahSen)}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${STATUS_BADGE[c.status]}`}>
                            {STATUS_LABEL[c.status]}
                          </span>
                          <UmurLabel c={c} />
                        </td>
                        <td className="p-3 min-w-[12rem] max-w-[20rem]">
                          <p className="font-semibold text-brand-dark/80">{KATEGORI_LABEL[c.kategori]}</p>
                          <p className="line-clamp-2">{c.tujuan}</p>
                          {c.status === "DITOLAK" && c.catatanAdmin && (
                            <p className="text-red-600 mt-1 line-clamp-2">Sebab: {c.catatanAdmin}</p>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <p>{formatDate(c.tarikhPerbelanjaan)}</p>
                          <p className="text-brand-dark/40">Hantar {formatDate(c.createdAt)}</p>
                        </td>
                        <td className="p-3">
                          {c.resitUrl ? (
                            isImej(c.resitUrl) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.resitUrl} alt="Resit" loading="lazy" className="h-12 w-12 object-cover rounded border border-brand-dark/15" />
                            ) : (
                              <span className="inline-block text-[11px] font-semibold border border-brand-dark/20 rounded px-2 py-1">PDF</span>
                            )
                          ) : (
                            <span className="text-brand-dark/40 whitespace-nowrap">Tiada</span>
                          )}
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            {c.status === "MENUNGGU" && (
                              <BtnUtama disabled={busy} onClick={() => jalankan([c.id], "DILULUSKAN")}>
                                Luluskan
                              </BtnUtama>
                            )}
                            {c.status === "DILULUSKAN" && (
                              <BtnUtama disabled={busy} onClick={() => jalankan([c.id], "DIBAYAR")}>
                                Tanda Dibayar
                              </BtnUtama>
                            )}
                            {boleh && (
                              <BtnTolak disabled={busy} onClick={() => setRejectTarget([c.id])}>
                                Tolak
                              </BtnTolak>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bar tindakan pukal - melekat di bawah skrin selagi ada pilihan */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 z-30 mt-3 -mx-4 sm:mx-0 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-brand-dark text-white sm:rounded-lg shadow-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0 sm:float-left sm:mt-1.5">
              <p className="text-sm">
                <b>{selected.size}</b> dipilih · <b className="text-brand-gold">{formatRM(selectedSen)}</b>
                {progress && (
                  <span className="ml-2 text-white/70">
                    Memproses {progress.done}/{progress.total}…
                  </span>
                )}
              </p>
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-white/60 underline sm:hidden">
                Batal
              </button>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {selMenunggu.length > 0 && (
                <button
                  type="button"
                  disabled={!!progress || busyIds.size > 0}
                  onClick={() => jalankan(selMenunggu.map((c) => c.id), "DILULUSKAN")}
                  className="flex-1 sm:flex-none bg-emerald-600 text-white text-xs font-bold rounded-md px-3 py-2.5 sm:py-2 disabled:opacity-50"
                >
                  Luluskan ({selMenunggu.length})
                </button>
              )}
              {selDiluluskan.length > 0 && (
                <button
                  type="button"
                  disabled={!!progress || busyIds.size > 0}
                  onClick={() => jalankan(selDiluluskan.map((c) => c.id), "DIBAYAR")}
                  className="flex-1 sm:flex-none bg-brand-gold text-white text-xs font-bold rounded-md px-3 py-2.5 sm:py-2 disabled:opacity-50"
                >
                  Tanda Dibayar ({selDiluluskan.length})
                </button>
              )}
              <button
                type="button"
                disabled={!!progress || busyIds.size > 0}
                onClick={() => setRejectTarget(Array.from(selected))}
                className="flex-1 sm:flex-none bg-white/10 border border-red-300/60 text-red-200 text-xs font-bold rounded-md px-3 py-2.5 sm:py-2 disabled:opacity-50"
              >
                Tolak ({selected.size})
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="hidden sm:block text-xs text-white/60 underline px-2">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {openClaim && (
        <ClaimPanel
          c={openClaim}
          pendua={pendua.get(openClaim.id)}
          busy={busyIds.has(openClaim.id)}
          posisi={openIdx >= 0 ? `${openIdx + 1} / ${visible.length}` : null}
          onPrev={openIdx > 0 ? () => setOpenId(visible[openIdx - 1].id) : undefined}
          onNext={openIdx >= 0 && openIdx < visible.length - 1 ? () => setOpenId(visible[openIdx + 1].id) : undefined}
          onClose={() => setOpenId(null)}
          onAction={(s) => (s === "DITOLAK" ? setRejectTarget([openClaim.id]) : jalankan([openClaim.id], s))}
          onCopy={salin}
          blokKekunci={!!rejectTarget}
        />
      )}

      {rejectTarget && (
        <DialogTolak
          bilangan={rejectTarget.length}
          jumlahSen={rows.filter((c) => rejectTarget.includes(c.id)).reduce((s, c) => s + c.jumlahSen, 0)}
          busy={busyIds.size > 0}
          progress={progress}
          onCancel={() => setRejectTarget(null)}
          onConfirm={(sebab) => jalankan(rejectTarget, "DITOLAK", sebab)}
        />
      )}

      {/* Toast */}
      <div className="fixed z-[70] bottom-4 left-4 right-4 sm:left-auto sm:w-96 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-md px-4 py-3 text-sm shadow-lg ${
              t.tone === "ok" ? "bg-emerald-700 text-white" : "bg-red-600 text-white"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function BtnUtama({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="bg-brand-dark text-white text-[11px] font-semibold rounded px-2.5 py-1.5 whitespace-nowrap disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function BtnTolak({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="border border-red-300 text-red-600 text-[11px] font-semibold rounded px-2.5 py-1.5 whitespace-nowrap disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function UmurLabel({ c }: { c: ClaimRow }) {
  if (c.status === "MENUNGGU") {
    const h = hariSejak(c.createdAt);
    return (
      <p className={`mt-1 text-[11px] whitespace-nowrap ${h >= HARI_TERTUNGGAK ? "text-red-600 font-semibold" : "text-brand-dark/40"}`}>
        {h === 0 ? "Hari ini" : `${h} hari menunggu`}
      </p>
    );
  }
  if (c.status === "DILULUSKAN") {
    const h = hariSejak(c.updatedAt);
    return <p className="mt-1 text-[11px] whitespace-nowrap text-blue-600">{h === 0 ? "Lulus hari ini" : `${h} hari belum bayar`}</p>;
  }
  return <p className="mt-1 text-[11px] whitespace-nowrap text-brand-dark/40">{formatDate(c.updatedAt)}</p>;
}

function AmaranChips({ c, pendua }: { c: ClaimRow; pendua?: number[] }) {
  if (!pendua && c.resitUrl) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {pendua && (
        <span className="text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5 whitespace-nowrap">
          ⚠ Pendua? {pendua.map((s) => `#${s}`).join(", ")}
        </span>
      )}
      {!c.resitUrl && (
        <span className="text-[10px] font-semibold bg-brand-cream text-brand-dark/60 border border-brand-dark/10 rounded px-1.5 py-0.5 whitespace-nowrap">
          Tiada resit
        </span>
      )}
    </div>
  );
}

function ClaimKad({
  c,
  pendua,
  selected,
  busy,
  onToggle,
  onOpen,
}: {
  c: ClaimRow;
  pendua?: number[];
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const boleh = c.status === "MENUNGGU" || c.status === "DILULUSKAN";
  return (
    <div
      className={`flex bg-white rounded-lg border shadow-sm overflow-hidden transition-colors ${
        selected ? "border-brand-gold ring-1 ring-brand-gold" : "border-brand-dark/10"
      } ${busy ? "opacity-50" : ""}`}
    >
      {boleh && (
        <label className="flex items-start pt-4 pl-3 pr-1" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggle} className="h-5 w-5" aria-label={`Pilih claim #${c.seq}`} />
        </label>
      )}
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left p-3 flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-brand-dark truncate">
              <span className="text-brand-dark/40">#{c.seq}</span> {c.namaPemohon}
            </p>
            <p className="font-bold text-sm text-brand-dark whitespace-nowrap">{formatRM(c.jumlahSen)}</p>
          </div>
          <p className="text-xs text-brand-dark/60 truncate mt-0.5">
            {KATEGORI_LABEL[c.kategori]} · {c.tujuan}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[c.status]}`}>
              {STATUS_LABEL[c.status]}
            </span>
            <span className="text-[11px] text-brand-dark/40">{formatDate(c.tarikhPerbelanjaan)}</span>
            {c.status === "MENUNGGU" && hariSejak(c.createdAt) >= HARI_TERTUNGGAK && (
              <span className="text-[11px] text-red-600 font-semibold">{hariSejak(c.createdAt)} hari</span>
            )}
          </div>
          <AmaranChips c={c} pendua={pendua} />
        </div>
        {c.resitUrl && isImej(c.resitUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.resitUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 object-cover rounded border border-brand-dark/10" />
        )}
      </button>
    </div>
  );
}

/**
 * Panel butiran: bottom sheet di telefon, laci kanan di desktop. Ada navigasi
 * sebelum/seterusnya dan pintasan papan kekunci (← → A P R Esc) supaya admin
 * boleh semak barisan claim satu-satu dengan cepat.
 */
function ClaimPanel({
  c,
  pendua,
  busy,
  posisi,
  onPrev,
  onNext,
  onClose,
  onAction,
  onCopy,
  blokKekunci,
}: {
  c: ClaimRow;
  pendua?: number[];
  busy: boolean;
  posisi: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onAction: (s: Tindakan) => void;
  onCopy: (teks: string, label: string) => void;
  blokKekunci: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [c.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (blokKekunci || busy) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "escape") onClose();
      else if (k === "arrowleft" && onPrev) onPrev();
      else if (k === "arrowright" && onNext) onNext();
      else if (k === "a" && c.status === "MENUNGGU") onAction("DILULUSKAN");
      else if (k === "p" && c.status === "DILULUSKAN") onAction("DIBAYAR");
      else if (k === "r" && (c.status === "MENUNGGU" || c.status === "DILULUSKAN")) onAction("DITOLAK");
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c, busy, blokKekunci, onPrev, onNext, onClose, onAction]);

  const boleh = c.status === "MENUNGGU" || c.status === "DILULUSKAN";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Claim #${c.seq}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[30rem] bg-brand-cream rounded-t-2xl md:rounded-none shadow-2xl flex flex-col">
        {/* Kepala */}
        <div className="bg-white rounded-t-2xl md:rounded-none border-b border-brand-dark/10 px-4 pt-2 pb-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-brand-dark/15 mb-2 md:hidden" />
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-brand-dark/40">Claim #{c.seq}{posisi && ` · ${posisi}`}</p>
              <p className="font-bold text-brand-dark truncate">{c.namaPemohon}</p>
            </div>
            <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Sebelum" className="h-9 w-9 rounded-md border border-brand-dark/15 text-brand-dark disabled:opacity-30">
              ‹
            </button>
            <button type="button" onClick={onNext} disabled={!onNext} aria-label="Seterusnya" className="h-9 w-9 rounded-md border border-brand-dark/15 text-brand-dark disabled:opacity-30">
              ›
            </button>
            <button type="button" onClick={onClose} aria-label="Tutup" className="h-9 w-9 rounded-md text-brand-dark/50 hover:bg-brand-cream text-lg">
              ✕
            </button>
          </div>
        </div>

        {/* Kandungan */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-white rounded-lg border border-brand-dark/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-brand-dark">{formatRM(c.jumlahSen)}</p>
                <p className="text-xs text-brand-dark/50 mt-0.5">{KATEGORI_LABEL[c.kategori]}</p>
              </div>
              <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${STATUS_BADGE[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <p className="text-sm text-brand-dark/80 mt-3 whitespace-pre-wrap">{c.tujuan}</p>
            {pendua && (
              <p className="mt-3 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded p-2">
                ⚠ Kemungkinan pendua dengan {pendua.map((s) => `#${s}`).join(", ")} - ahli, jumlah dan tarikh perbelanjaan sama.
              </p>
            )}
            {c.status === "DITOLAK" && c.catatanAdmin && (
              <p className="mt-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded p-2">Sebab ditolak: {c.catatanAdmin}</p>
            )}
          </div>

          {/* Resit */}
          <div className="bg-white rounded-lg border border-brand-dark/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark/40 mb-2">Resit</p>
            {c.resitUrl ? (
              isImej(c.resitUrl) ? (
                <a href={c.resitUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.resitUrl} alt="Resit" className="w-full max-h-80 object-contain rounded bg-brand-cream" />
                  <span className="block text-center text-xs font-semibold text-brand-gold mt-2">Buka saiz penuh →</span>
                </a>
              ) : (
                <a
                  href={c.resitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-semibold border border-brand-dark/20 rounded-md py-3 hover:bg-brand-cream"
                >
                  📄 Buka Resit (PDF)
                </a>
              )
            ) : (
              <p className="text-sm text-brand-dark/40">Tiada resit dilampirkan.</p>
            )}
          </div>

          {/* Bank - dengan butang salin untuk pindahan manual */}
          <div className="bg-white rounded-lg border border-brand-dark/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark/40 mb-2">Akaun Bank</p>
            <dl className="text-sm space-y-2">
              <BarisSalin label="Bank" nilai={c.bankName} onCopy={onCopy} />
              <BarisSalin label="No Akaun" nilai={c.accountNo} onCopy={onCopy} mono />
              <BarisSalin label="Pemegang" nilai={c.accountHolder} onCopy={onCopy} />
              <BarisSalin label="Jumlah" nilai={(c.jumlahSen / 100).toFixed(2)} onCopy={onCopy} mono />
            </dl>
          </div>

          {/* Butiran & garis masa */}
          <div className="bg-white rounded-lg border border-brand-dark/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark/40 mb-2">Butiran</p>
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-brand-dark/50">No Ahli</dt>
              <dd className="text-brand-dark">{c.memberNo}</dd>
              <dt className="text-brand-dark/50">Tarikh belanja</dt>
              <dd className="text-brand-dark">{formatDate(c.tarikhPerbelanjaan)}</dd>
            </dl>
            <ol className="mt-4 border-l-2 border-brand-dark/10 ml-1 space-y-3">
              <li className="pl-3 relative">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-xs font-semibold text-brand-dark">Dihantar</p>
                <p className="text-[11px] text-brand-dark/50">{formatDateTime(c.createdAt)}</p>
              </li>
              {c.status !== "MENUNGGU" && (
                <li className="pl-3 relative">
                  <span
                    className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${
                      c.status === "DITOLAK" ? "bg-red-500" : c.status === "DIBAYAR" ? "bg-emerald-600" : "bg-blue-500"
                    }`}
                  />
                  <p className="text-xs font-semibold text-brand-dark">{STATUS_LABEL[c.status]} (kemaskini terakhir)</p>
                  <p className="text-[11px] text-brand-dark/50">{formatDateTime(c.updatedAt)}</p>
                </li>
              )}
            </ol>
          </div>

          <p className="hidden md:block text-[11px] text-brand-dark/40 text-center">
            Pintasan: ← → tukar claim · A luluskan · P tanda dibayar · R tolak · Esc tutup
          </p>
        </div>

        {/* Tindakan */}
        {boleh && (
          <div className="bg-white border-t border-brand-dark/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("DITOLAK")}
              className="flex-1 border border-red-300 text-red-600 text-sm font-bold rounded-md py-3 disabled:opacity-50"
            >
              Tolak
            </button>
            {c.status === "MENUNGGU" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("DILULUSKAN")}
                className="flex-[2] bg-emerald-600 text-white text-sm font-bold rounded-md py-3 disabled:opacity-50"
              >
                {busy ? "Memproses…" : "Luluskan"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("DIBAYAR")}
                className="flex-[2] bg-brand-gold text-white text-sm font-bold rounded-md py-3 disabled:opacity-50"
              >
                {busy ? "Memproses…" : "Tanda Dibayar"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BarisSalin({
  label,
  nilai,
  onCopy,
  mono,
}: {
  label: string;
  nilai: string;
  onCopy: (teks: string, label: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-20 shrink-0 text-brand-dark/50">{label}</dt>
      <dd className={`flex-1 min-w-0 text-brand-dark break-all ${mono ? "font-mono" : ""}`}>{nilai}</dd>
      <button
        type="button"
        onClick={() => onCopy(nilai, label)}
        className="shrink-0 text-[11px] font-semibold text-brand-gold border border-brand-gold/40 rounded px-2 py-1 hover:bg-brand-gold/10"
      >
        Salin
      </button>
    </div>
  );
}

function DialogTolak({
  bilangan,
  jumlahSen,
  busy,
  progress,
  onCancel,
  onConfirm,
}: {
  bilangan: number;
  jumlahSen: number;
  busy: boolean;
  progress: { done: number; total: number } | null;
  onCancel: () => void;
  onConfirm: (sebab: string) => void;
}) {
  const [sebab, setSebab] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onCancel} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p className="font-bold text-brand-dark">Tolak {bilangan > 1 ? `${bilangan} claim` : "claim"}</p>
        <p className="text-xs text-brand-dark/50 mb-3">
          Jumlah {formatRM(jumlahSen)} · sebab akan dihantar melalui emel ke ahli.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SEBAB_TOLAK.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSebab(s)}
              className={`text-[11px] rounded-full px-2.5 py-1 border ${
                sebab === s ? "bg-red-50 border-red-300 text-red-700" : "border-brand-dark/15 text-brand-dark/60"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          rows={3}
          value={sebab}
          onChange={(e) => setSebab(e.target.value)}
          placeholder="Tulis sebab ditolak…"
          className="w-full text-sm border border-brand-dark/20 rounded-md p-2.5 focus:outline-none focus:border-red-400"
        />
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={onCancel} disabled={busy} className="flex-1 border border-brand-dark/15 text-sm font-semibold rounded-md py-2.5 disabled:opacity-50">
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(sebab.trim())}
            disabled={busy || !sebab.trim()}
            className="flex-1 bg-red-600 text-white text-sm font-bold rounded-md py-2.5 disabled:opacity-50"
          >
            {busy ? (progress ? `Memproses ${progress.done}/${progress.total}…` : "Memproses…") : "Sahkan Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
}
