"use client";

// Land Listing Editor LANDHUB (Land -> Edit). Semua tab kongsi SATU objek
// borang; Save hantar keseluruhannya ke /api/geran-admin/geran/update dalam
// satu transaksi. Tab disimpan dalam ?tab= supaya pautan & muat semula
// kembali ke tab yang sama.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, Loader2, Send } from "lucide-react";
import StatusBadge from "@/components/geran/admin/StatusBadge";
import { STATUS_BUTIRAN_AWAM, type StatusGeranKey } from "@/lib/geran/status";
import TabGeneral from "./TabGeneral";
import TabLots from "./TabLots";
import { Tab360, TabDokumen, TabMedia, TabSeo } from "./TabLain";
import type { EditorForm, EditorMeta } from "./types";

const TAB = [
  { kunci: "general", label: "General" },
  { kunci: "lots", label: "Lots" },
  { kunci: "media", label: "Media" },
  { kunci: "360", label: "360°" },
  { kunci: "documents", label: "Documents" },
  { kunci: "seo", label: "SEO" },
] as const;
type KunciTab = (typeof TAB)[number]["kunci"];

const nombor = (s: string) => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const teks = (s: string) => s.trim() || null;

function keMuatan(form: EditorForm, geranId: string) {
  return {
    geranId,
    tajuk: form.tajuk,
    sumber: form.sumber,
    jenisTanah: form.jenisTanah,
    jenisHakmilik: form.jenisHakmilik,
    statusPemilikan: form.statusPemilikan,
    keluasan: nombor(form.keluasan) ?? 0,
    unitKeluasan: form.unitKeluasan,
    nomborLot: teks(form.nomborLot),
    nomborGeran: teks(form.nomborGeran),
    keterangan: teks(form.keterangan),
    negeri: form.negeri,
    daerahMukim: form.daerahMukim,
    mukim: teks(form.mukim),
    alamat: teks(form.alamat),
    latitude: nombor(form.latitude),
    longitude: nombor(form.longitude),
    namaPenjual: form.namaPenjual,
    telefonPenjual: form.telefonPenjual,
    emelPenjual: form.emelPenjual,
    hargaPasaranRM: nombor(form.hargaPasaranRM),
    hargaAmbilRM: nombor(form.hargaAmbilRM),
    hargaSiaranRM: nombor(form.hargaSiaranRM),
    catatanRundingan: teks(form.catatanRundingan),
    gambarUrls: form.gambarUrls,
    gambarPolygons: form.gambarPolygons,
    seoTitle: teks(form.seoTitle),
    seoDescription: teks(form.seoDescription),
    status: form.status,
    catatanAdmin: teks(form.catatanAdmin),
    lots: form.lots.map((l) => ({
      ...(l.id ? { id: l.id } : {}),
      noLot: l.noLot,
      status: l.status,
      keluasan: nombor(l.keluasan),
      unitKeluasan: l.unitKeluasan,
      tenure: l.tenure || null,
      kategori: l.kategori || null,
      hargaRM: nombor(l.hargaRM),
      nomborGeran: teks(l.nomborGeran),
      latitude: nombor(l.latitude),
      longitude: nombor(l.longitude),
      nota: teks(l.nota),
    })),
  };
}

export default function LandListingEditor({ awal, meta }: { awal: EditorForm; meta: EditorMeta }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabUrl = searchParams.get("tab");
  const tab: KunciTab = TAB.some((t) => t.kunci === tabUrl) ? (tabUrl as KunciTab) : "general";

  const [form, setForm] = useState<EditorForm>(awal);
  const [tersimpan, setTersimpan] = useState(() => JSON.stringify(awal));
  const [statusTersimpan, setStatusTersimpan] = useState<StatusGeranKey>(awal.status);
  const [sibuk, setSibuk] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [berjaya, setBerjaya] = useState("");

  const ubah = useCallback((p: Partial<EditorForm>) => {
    setForm((f) => ({ ...f, ...p }));
    setBerjaya("");
  }, []);

  const kotor = useMemo(() => JSON.stringify(form) !== tersimpan, [form, tersimpan]);

  // Amaran sebelum tutup tab / muat semula dengan perubahan belum disimpan.
  useEffect(() => {
    if (!kotor) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [kotor]);

  function tukarTab(k: KunciTab) {
    const p = new URLSearchParams(searchParams.toString());
    if (k === "general") p.delete("tab");
    else p.set("tab", k);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  async function simpan(statusBaru?: StatusGeranKey) {
    const sasaran = statusBaru ? { ...form, status: statusBaru } : form;
    setError("");
    setBerjaya("");
    setSibuk(statusBaru ? "publish" : "save");
    try {
      const res = await fetch("/api/geran-admin/geran/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keMuatan(sasaran, meta.id)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Lot baru kini ada id sebenar - pautkan ikut susunan supaya simpan
      // seterusnya kemas kini rekod yang sama, bukan cipta semula. `kunci`
      // sengaja tak diubah supaya lot yang sedang dipilih kekal terpilih.
      const ids: string[] = data.lotIds ?? [];
      const baru: EditorForm = {
        ...sasaran,
        lots: sasaran.lots.map((l, i) => (ids[i] ? { ...l, id: ids[i] } : l)),
      };
      setForm(baru);
      setTersimpan(JSON.stringify(baru));
      setStatusTersimpan(baru.status);
      setBerjaya(statusBaru === "PUBLISHED" ? "Published — the listing is now live." : "All changes saved.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSibuk(null);
    }
  }

  const tersiar = STATUS_BUTIRAN_AWAM.includes(statusTersimpan);

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href="/geran/admin/geran"
        className="inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-black/80 mb-3"
      >
        <ArrowLeft size={15} /> All Land
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/40">Edit Land Listing · #{meta.seq}</p>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight truncate max-w-[640px]">
              {form.tajuk || "Untitled land"}
            </h1>
            <StatusBadge status={statusTersimpan} size="md" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (kotor && !window.confirm("Preview shows the last saved version. Open it anyway?")) return;
              window.open(`/geran/${meta.id}?preview=1`, "_blank", "noopener");
            }}
            className="inline-flex items-center gap-1.5 h-10 rounded-lg border border-black/[0.12] bg-white px-4 text-sm font-semibold hover:bg-black/[0.03]"
          >
            <Eye size={16} /> Preview
          </button>
          <button
            type="button"
            onClick={() => simpan()}
            disabled={sibuk !== null}
            className="inline-flex items-center gap-1.5 h-10 rounded-lg border border-black/[0.12] bg-white px-4 text-sm font-semibold hover:bg-black/[0.03] disabled:opacity-50"
          >
            {sibuk === "save" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {form.status === "DRAFT" ? "Save Draft" : "Save"}
          </button>
          {!tersiar && (
            <button
              type="button"
              onClick={() => simpan("PUBLISHED")}
              disabled={sibuk !== null}
              className="inline-flex items-center gap-1.5 h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {sibuk === "publish" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Publish
            </button>
          )}
        </div>
      </div>

      {(error || berjaya || kotor) && (
        <div
          className={`mb-4 rounded-xl px-4 py-2.5 text-sm ${
            error
              ? "bg-red-50 text-red-700 border border-red-200"
              : berjaya
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
          role={error ? "alert" : "status"}
        >
          {error || berjaya || "You have unsaved changes."}
        </div>
      )}

      <div className="flex gap-1 border-b border-black/[0.08] mb-5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {TAB.map((t) => {
          const aktif = t.kunci === tab;
          const kiraan = t.kunci === "lots" ? form.lots.length : t.kunci === "media" ? form.gambarUrls.length : 0;
          return (
            <button
              key={t.kunci}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => tukarTab(t.kunci)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                aktif ? "border-emerald-700 text-emerald-800" : "border-transparent text-black/45 hover:text-black/75"
              }`}
            >
              {t.label}
              {kiraan > 0 && (
                <span className="ml-1.5 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[11px] text-black/55">{kiraan}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "general" && <TabGeneral form={form} ubah={ubah} meta={meta} />}
      {tab === "lots" && <TabLots form={form} ubah={ubah} />}
      {tab === "media" && <TabMedia form={form} ubah={ubah} />}
      {tab === "360" && <Tab360 />}
      {tab === "documents" && <TabDokumen meta={meta} />}
      {tab === "seo" && <TabSeo form={form} ubah={ubah} meta={meta} />}
    </div>
  );
}
