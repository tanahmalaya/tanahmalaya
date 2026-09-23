"use client";

// Tab Media, Documents & SEO untuk Land Listing Editor. Sempadan lot dilukis
// dalam tab Lots (Lot Marker) dan 360° dalam components/geran/admin/panorama;
// Document Vault penuh datang dalam fasa LANDHUB seterusnya.

import { ExternalLink, FileText, Lock } from "lucide-react";
import GambarGeranUpload from "@/components/geran/GambarGeranUpload";
import { KAD, LABEL, INPUT, TEXTAREA, type EditorForm, type EditorMeta, type UbahForm } from "./types";

function Tajuk({ children, nota }: { children: React.ReactNode; nota?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">{children}</h2>
      {nota && <p className="text-xs text-black/45 mt-1">{nota}</p>}
    </div>
  );
}

export function TabMedia({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  return (
    <div className="space-y-5">
      <section className={`${KAD} p-5 sm:p-6`}>
        <Tajuk nota="The first photo is the cover image in the directory and link previews.">
          Property Photos
        </Tajuk>
        <p className="text-xs text-black/45 -mt-2 mb-3">
          Mark lots, roads and rivers on these photos in the <strong>Lots</strong> tab.
        </p>
        <GambarGeranUpload value={form.gambarUrls} onChange={(gambarUrls) => ubah({ gambarUrls })} />
      </section>
    </div>
  );
}

function AkanDatang({ ikon: Ikon, tajuk, teks }: { ikon: typeof Lock; tajuk: string; teks: string }) {
  return (
    <div className={`${KAD} p-10 flex flex-col items-center text-center`}>
      <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
        <Ikon size={22} />
      </span>
      <p className="font-bold">{tajuk}</p>
      <p className="text-sm text-black/50 mt-1 max-w-md">{teks}</p>
    </div>
  );
}

export function TabDokumen({ meta }: { meta: EditorMeta }) {
  return (
    <div className="space-y-5">
      <section className={`${KAD} p-5 sm:p-6`}>
        <Tajuk nota="Private files - never shown on the public listing.">Title Documents</Tajuk>
        {meta.adaSalinanGeran ? (
          <a
            href={`/api/geran-admin/salinan-geran/${meta.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-black/[0.08] px-4 py-3 hover:bg-black/[0.02]"
          >
            <span className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <FileText size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Full title copy (Geran)</span>
              <span className="block text-xs text-black/45">PDF · Admin only</span>
            </span>
            <ExternalLink size={15} className="text-black/40" />
          </a>
        ) : (
          <p className="text-sm text-black/45">No title copy attached to this listing.</p>
        )}
      </section>
      <AkanDatang
        ikon={Lock}
        tajuk="Document vault - coming soon"
        teks="Official search, land plan, quit rent receipt, owner IC, SPA and valuation report, each with Admin / Consultant / Buyer / Public access."
      />
    </div>
  );
}

// Had panjang yang Google biasanya papar tanpa dipotong.
const HAD_TAJUK = 60;
const HAD_KETERANGAN = 160;

export function TabSeo({ form, ubah, meta }: { form: EditorForm; ubah: UbahForm; meta: EditorMeta }) {
  const tajukAsal = `${form.tajuk} - GERAN`;
  const keteranganAsal =
    form.keterangan.trim().slice(0, HAD_KETERANGAN) || `${form.tajuk}, ${form.daerahMukim}, ${form.negeri}`;
  const tajuk = form.seoTitle.trim() || tajukAsal;
  const keterangan = form.seoDescription.trim() || keteranganAsal;

  const kiraan = (n: number, had: number) => (
    <span className={`text-xs tabular-nums ${n > had ? "text-red-600 font-semibold" : "text-black/40"}`}>
      {n}/{had}
    </span>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className={`${KAD} p-5 sm:p-6 space-y-4`}>
        <Tajuk nota="Leave empty to use the land name and description automatically.">Search Engine</Tajuk>
        <label className="block">
          <span className="flex justify-between">
            <span className={LABEL}>SEO title</span>
            {kiraan(form.seoTitle.length, HAD_TAJUK)}
          </span>
          <input
            value={form.seoTitle}
            onChange={(e) => ubah({ seoTitle: e.target.value })}
            placeholder={tajukAsal}
            maxLength={70}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="flex justify-between">
            <span className={LABEL}>Meta description</span>
            {kiraan(form.seoDescription.length, HAD_KETERANGAN)}
          </span>
          <textarea
            rows={4}
            value={form.seoDescription}
            onChange={(e) => ubah({ seoDescription: e.target.value })}
            placeholder={keteranganAsal}
            maxLength={170}
            className={TEXTAREA}
          />
        </label>
      </section>

      <section className={`${KAD} p-5 sm:p-6`}>
        <Tajuk>Google Preview</Tajuk>
        <div className="rounded-xl border border-black/[0.08] p-4">
          <p className="text-xs text-black/55">gerantanah.com › {meta.id}</p>
          <p className="text-[18px] text-[#1a0dab] leading-snug mt-1 line-clamp-1">{tajuk}</p>
          <p className="text-[13px] text-black/60 mt-1 line-clamp-2">{keterangan}</p>
        </div>
      </section>
    </div>
  );
}
