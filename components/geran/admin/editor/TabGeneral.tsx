"use client";

import { ExternalLink, FileText, MapPin } from "lucide-react";
import HargaInput from "@/components/geran/HargaInput";
import StatusPemilikanBadge from "@/components/geran/StatusPemilikanBadge";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import {
  JENIS_HAKMILIK_LABEL,
  JENIS_TANAH_LABEL,
  STATUS_PEMILIKAN_LABEL,
  STATUS_PEMILIKAN_NOTA,
  SUMBER_GERAN_LABEL,
  UNIT_KELUASAN_LABEL,
  formatRM,
} from "@/lib/geran";
import { STATUS_GERAN, STATUS_INFO } from "@/lib/geran/status";
import { INPUT, KAD, LABEL, TEXTAREA, type EditorForm, type EditorMeta, type UbahForm } from "./types";

// Tukar keluasan kepada ekar untuk "Price / acre" - unit yang pembeli tanah
// Malaysia biasa banding, walaupun penyenaraian direkod dalam kaki persegi.
const EKAR_SEUNIT: Record<string, number> = { EKAR: 1, HEKTAR: 2.47105, SQFT: 1 / 43560 };

export function hargaSeEkar(hargaRM: string, keluasan: string, unit: string): number | null {
  const harga = Number(hargaRM);
  const ekar = Number(keluasan) * (EKAR_SEUNIT[unit] ?? 0);
  if (!harga || !ekar) return null;
  return harga / ekar;
}

function Seksyen({ tajuk, children, kanan }: { tajuk: string; children: React.ReactNode; kanan?: React.ReactNode }) {
  return (
    <section className={`${KAD} p-5 sm:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">{tajuk}</h2>
        {kanan}
      </div>
      {children}
    </section>
  );
}

function Medan({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export default function TabGeneral({ form, ubah, meta }: { form: EditorForm; ubah: UbahForm; meta: EditorMeta }) {
  const seEkar = hargaSeEkar(form.hargaSiaranRM, form.keluasan, form.unitKeluasan);
  const ambil = Number(form.hargaAmbilRM);
  const siaran = Number(form.hargaSiaranRM);
  const marginSen = ambil > 0 && siaran > 0 ? Math.round((siaran - ambil) * 100) : null;
  const adaKoordinat = form.latitude.trim() !== "" && form.longitude.trim() !== "";
  const urlPeta = adaKoordinat
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${form.latitude},${form.longitude}`)}`
    : `https://www.google.com/maps/search/${encodeURIComponent(
        [form.alamat, form.mukim, form.daerahMukim, form.negeri].filter(Boolean).join(", ")
      )}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-5">
        <Seksyen tajuk="Property Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <Medan label="Land name" className="sm:col-span-2">
              <input
                value={form.tajuk}
                onChange={(e) => ubah({ tajuk: e.target.value })}
                placeholder="e.g. Agricultural Land 5.2 Acres - Kluang"
                className={INPUT}
              />
            </Medan>
            <Medan label="Category">
              <select value={form.jenisTanah} onChange={(e) => ubah({ jenisTanah: e.target.value })} className={INPUT}>
                {Object.entries(JENIS_TANAH_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Tenure">
              <select
                value={form.jenisHakmilik}
                onChange={(e) => ubah({ jenisHakmilik: e.target.value })}
                className={INPUT}
              >
                {Object.entries(JENIS_HAKMILIK_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Listing price (RM)">
              <HargaInput
                value={form.hargaSiaranRM}
                onChange={(v) => ubah({ hargaSiaranRM: v })}
                className={INPUT}
                placeholder="e.g. 850k"
                previewClassName="mt-1 text-xs text-black/40"
              />
            </Medan>
            <Medan label="Price / acre">
              <input
                disabled
                value={seEkar === null ? "" : formatRM(Math.round(seEkar * 100))}
                placeholder="Calculated from price & size"
                className={INPUT}
              />
            </Medan>
            <Medan label="Land size">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.keluasan}
                  onChange={(e) => ubah({ keluasan: e.target.value })}
                  className={INPUT}
                />
                <select
                  value={form.unitKeluasan}
                  onChange={(e) => ubah({ unitKeluasan: e.target.value })}
                  className={`${INPUT} w-32 shrink-0`}
                >
                  {Object.entries(UNIT_KELUASAN_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </Medan>
            <Medan label="Ownership">
              <select
                value={form.statusPemilikan}
                onChange={(e) => ubah({ statusPemilikan: e.target.value })}
                className={INPUT}
              >
                {Object.entries(STATUS_PEMILIKAN_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Lot no.">
              <input value={form.nomborLot} onChange={(e) => ubah({ nomborLot: e.target.value })} className={INPUT} />
            </Medan>
            <Medan label="Title (grant) no.">
              <input
                value={form.nomborGeran}
                onChange={(e) => ubah({ nomborGeran: e.target.value })}
                placeholder="e.g. GM 12345"
                className={INPUT}
              />
            </Medan>
            <div className="sm:col-span-2 -mt-1 flex items-start gap-2 text-xs text-black/50">
              <StatusPemilikanBadge status={form.statusPemilikan} />
              <span className="pt-0.5">{STATUS_PEMILIKAN_NOTA[form.statusPemilikan]}</span>
            </div>
            <Medan label="Description (shown to buyers)" className="sm:col-span-2">
              <textarea
                rows={5}
                value={form.keterangan}
                onChange={(e) => ubah({ keterangan: e.target.value })}
                className={TEXTAREA}
              />
            </Medan>
          </div>
        </Seksyen>

        <Seksyen
          tajuk="Location"
          kanan={
            <a
              href={urlPeta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.12] px-3 py-1.5 text-xs font-semibold hover:bg-black/[0.03]"
            >
              <MapPin size={14} /> Open Map
            </a>
          }
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Medan label="State">
              <select value={form.negeri} onChange={(e) => ubah({ negeri: e.target.value })} className={INPUT}>
                {!NEGERI_LIST.includes(form.negeri) && <option value={form.negeri}>{form.negeri || "—"}</option>}
                {NEGERI_LIST.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="District">
              <input
                value={form.daerahMukim}
                onChange={(e) => ubah({ daerahMukim: e.target.value })}
                className={INPUT}
              />
            </Medan>
            <Medan label="Mukim">
              <input value={form.mukim} onChange={(e) => ubah({ mukim: e.target.value })} className={INPUT} />
            </Medan>
            <Medan label="Address">
              <input value={form.alamat} onChange={(e) => ubah({ alamat: e.target.value })} className={INPUT} />
            </Medan>
            <Medan label="Latitude">
              <input
                inputMode="decimal"
                value={form.latitude}
                onChange={(e) => ubah({ latitude: e.target.value })}
                placeholder="e.g. 2.0301"
                className={INPUT}
              />
            </Medan>
            <Medan label="Longitude">
              <input
                inputMode="decimal"
                value={form.longitude}
                onChange={(e) => ubah({ longitude: e.target.value })}
                placeholder="e.g. 103.3185"
                className={INPUT}
              />
            </Medan>
          </div>
          <p className="text-xs text-black/40 mt-3">
            Tip: in Google Maps, right-click the land and click the coordinates to copy them, then paste the two
            numbers here.
          </p>
        </Seksyen>
      </div>

      <div className="space-y-5">
        <Seksyen tajuk="Workflow">
          <Medan label="Status">
            <select
              value={form.status}
              onChange={(e) => ubah({ status: e.target.value as EditorForm["status"] })}
              className={INPUT}
            >
              {STATUS_GERAN.map((s) => (
                <option key={s} value={s}>
                  {STATUS_INFO[s].label}
                </option>
              ))}
            </select>
          </Medan>
          <ol className="mt-4 space-y-1.5">
            {STATUS_GERAN.filter((s) => s !== "REJECTED" && s !== "ARCHIVED").map((s, i, semua) => {
              const kini = (semua as readonly string[]).indexOf(form.status);
              const selesai = kini >= 0 && i <= kini;
              return (
                <li key={s} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selesai ? `${STATUS_INFO[s].dot} text-white` : "bg-black/[0.06] text-black/35"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={selesai ? "font-semibold" : "text-black/40"}>{STATUS_INFO[s].label}</span>
                </li>
              );
            })}
          </ol>
          <Medan label="Admin note / rejection reason" className="mt-4">
            <textarea
              rows={3}
              value={form.catatanAdmin}
              onChange={(e) => ubah({ catatanAdmin: e.target.value })}
              placeholder={form.status === "REJECTED" ? "Required - shown to the seller" : "Optional"}
              className={TEXTAREA}
            />
          </Medan>
        </Seksyen>

        <Seksyen tajuk="Internal Pricing">
          <p className="text-xs text-black/45 -mt-2 mb-4">Only the listing price is shown to buyers.</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-black/55">Seller asking price</span>
              <span className="font-semibold">
                {meta.hargaDimintaSen === null ? "—" : formatRM(meta.hargaDimintaSen)}
              </span>
            </div>
            <Medan label="Market estimate (RM)">
              <HargaInput
                value={form.hargaPasaranRM}
                onChange={(v) => ubah({ hargaPasaranRM: v })}
                className={INPUT}
                placeholder="e.g. 800k"
                previewClassName="mt-1 text-xs text-black/40"
              />
            </Medan>
            <Medan label="Our take price (RM)">
              <HargaInput
                value={form.hargaAmbilRM}
                onChange={(v) => ubah({ hargaAmbilRM: v })}
                className={INPUT}
                placeholder="e.g. 700k"
                previewClassName="mt-1 text-xs text-black/40"
              />
            </Medan>
            {marginSen !== null && (
              <p
                className={`text-sm font-semibold rounded-lg px-3 py-2 ${
                  marginSen >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                Margin: {formatRM(marginSen)}
              </p>
            )}
            <Medan label="Negotiation notes">
              <textarea
                rows={3}
                value={form.catatanRundingan}
                onChange={(e) => ubah({ catatanRundingan: e.target.value })}
                className={TEXTAREA}
              />
            </Medan>
          </div>
        </Seksyen>

        <Seksyen tajuk="Contact & Source">
          <div className="space-y-3">
            <Medan label="Source">
              <select
                value={form.sumber}
                onChange={(e) => ubah({ sumber: e.target.value })}
                disabled={meta.dariPenjual}
                className={INPUT}
              >
                {Object.entries(SUMBER_GERAN_LABEL)
                  .filter(([k]) => meta.dariPenjual || k !== "PENGGUNA")
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </Medan>
            <Medan label={meta.dariPenjual ? "Seller name" : "Contact name"}>
              <input
                value={form.namaPenjual}
                onChange={(e) => ubah({ namaPenjual: e.target.value })}
                className={INPUT}
              />
            </Medan>
            <Medan label="Phone">
              <input
                value={form.telefonPenjual}
                onChange={(e) => ubah({ telefonPenjual: e.target.value })}
                className={INPUT}
              />
            </Medan>
            <Medan label="Email">
              <input
                value={form.emelPenjual}
                onChange={(e) => ubah({ emelPenjual: e.target.value })}
                className={INPUT}
              />
            </Medan>
            {meta.adaSalinanGeran && (
              <a
                href={`/api/geran-admin/salinan-geran/${meta.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.06]"
              >
                <FileText size={16} /> Full title copy (PDF) <ExternalLink size={13} className="ml-auto opacity-50" />
              </a>
            )}
          </div>
        </Seksyen>
      </div>
    </div>
  );
}
