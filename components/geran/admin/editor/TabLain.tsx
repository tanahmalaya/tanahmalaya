"use client";

// Tab SEO untuk Land Listing Editor. Tab lain ada dalam folder masing-masing:
// Lot Marker (lotmarker/), 360° (panorama/), Media (media/), Documents (dokumen/).

import { KAD, LABEL, INPUT, TEXTAREA, type EditorForm, type EditorMeta, type UbahForm } from "./types";

function Tajuk({ children, nota }: { children: React.ReactNode; nota?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">{children}</h2>
      {nota && <p className="text-xs text-black/45 mt-1">{nota}</p>}
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
