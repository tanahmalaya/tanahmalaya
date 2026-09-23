"use client";

import { useState } from "react";
import { LandPlot, Plus, Trash2 } from "lucide-react";
import HargaInput from "@/components/geran/HargaInput";
import { JENIS_HAKMILIK_LABEL, JENIS_TANAH_LABEL, UNIT_KELUASAN_LABEL, formatRM } from "@/lib/geran";
import { INPUT, KAD, LABEL, TEXTAREA, type EditorForm, type LotForm, type StatusLotKey, type UbahForm } from "./types";

export const STATUS_LOT: Record<StatusLotKey, { label: string; badge: string; dot: string }> = {
  AVAILABLE: { label: "Available", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  RESERVED: { label: "Reserved", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  SOLD: { label: "Sold", badge: "bg-red-50 text-red-600 ring-red-200", dot: "bg-red-500" },
};

let kiraanLotBaru = 0;
function lotKosong(form: EditorForm): LotForm {
  kiraanLotBaru += 1;
  return {
    kunci: `baru-${Date.now()}-${kiraanLotBaru}`,
    id: null,
    noLot: "",
    status: "AVAILABLE",
    keluasan: "",
    unitKeluasan: form.unitKeluasan,
    tenure: form.jenisHakmilik,
    kategori: form.jenisTanah,
    hargaRM: "",
    nomborGeran: "",
    latitude: "",
    longitude: "",
    nota: "",
  };
}

function Medan({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export default function TabLots({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  const [pilihan, setPilihan] = useState<string | null>(form.lots[0]?.kunci ?? null);
  const lot = form.lots.find((l) => l.kunci === pilihan) ?? null;

  function ubahLot(perubahan: Partial<LotForm>) {
    ubah({ lots: form.lots.map((l) => (l.kunci === pilihan ? { ...l, ...perubahan } : l)) });
  }

  function tambah() {
    const baru = lotKosong(form);
    baru.noLot = `Lot ${String.fromCharCode(65 + (form.lots.length % 26))}`;
    ubah({ lots: [...form.lots, baru] });
    setPilihan(baru.kunci);
  }

  function padam() {
    if (!lot) return;
    if (!window.confirm(`Delete ${lot.noLot || "this lot"}? It is removed when you save.`)) return;
    const baki = form.lots.filter((l) => l.kunci !== lot.kunci);
    ubah({ lots: baki });
    setPilihan(baki[0]?.kunci ?? null);
  }

  const kira = (s: StatusLotKey) => form.lots.filter((l) => l.status === s).length;
  const jumlahHarga = form.lots.reduce((n, l) => n + (Number(l.hargaRM) || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
      <div className={`${KAD} p-4 self-start`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">
            Lots <span className="text-black/35">({form.lots.length})</span>
          </h2>
          <button
            type="button"
            onClick={tambah}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 hover:bg-emerald-800"
          >
            <Plus size={14} /> Add Lot
          </button>
        </div>

        {form.lots.length > 0 && (
          <div className="flex gap-3 text-[11.5px] text-black/55 mb-3 flex-wrap">
            {(Object.keys(STATUS_LOT) as StatusLotKey[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_LOT[s].dot}`} />
                {kira(s)} {STATUS_LOT[s].label}
              </span>
            ))}
          </div>
        )}

        <ul className="space-y-1.5">
          {form.lots.map((l) => (
            <li key={l.kunci}>
              <button
                type="button"
                onClick={() => setPilihan(l.kunci)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  l.kunci === pilihan
                    ? "border-emerald-600/50 bg-emerald-50/60"
                    : "border-black/[0.07] hover:bg-black/[0.02]"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{l.noLot || "Untitled lot"}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_LOT[l.status].dot}`} title={STATUS_LOT[l.status].label} />
                </span>
                <span className="block text-xs text-black/50 mt-0.5">
                  {l.keluasan ? `${l.keluasan} ${UNIT_KELUASAN_LABEL[l.unitKeluasan]}` : "—"}
                  {" · "}
                  {l.hargaRM ? formatRM(Math.round(Number(l.hargaRM) * 100)) : "No price"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {form.lots.length === 0 ? (
          <div className="text-center py-8 px-2">
            <LandPlot size={28} className="mx-auto text-black/25 mb-2" />
            <p className="text-sm font-semibold">No lots yet</p>
            <p className="text-xs text-black/45 mt-1">
              Split this land into lots when each part is sold separately, with its own price and status.
            </p>
          </div>
        ) : (
          <p className="text-xs text-black/45 mt-3 pt-3 border-t border-black/[0.06]">
            Total of lot prices: <strong className="text-black/70">{formatRM(Math.round(jumlahHarga * 100))}</strong>
          </p>
        )}
      </div>

      {lot ? (
        <div className={`${KAD} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-xl font-extrabold truncate">{lot.noLot || "Untitled lot"}</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_LOT[lot.status].badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LOT[lot.status].dot}`} />
              {STATUS_LOT[lot.status].label}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Medan label="Lot no. / name">
              <input value={lot.noLot} onChange={(e) => ubahLot({ noLot: e.target.value })} className={INPUT} />
            </Medan>
            <Medan label="Status">
              <select
                value={lot.status}
                onChange={(e) => ubahLot({ status: e.target.value as StatusLotKey })}
                className={INPUT}
              >
                {(Object.keys(STATUS_LOT) as StatusLotKey[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LOT[s].label}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Area">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={lot.keluasan}
                  onChange={(e) => ubahLot({ keluasan: e.target.value })}
                  className={INPUT}
                />
                <select
                  value={lot.unitKeluasan}
                  onChange={(e) => ubahLot({ unitKeluasan: e.target.value })}
                  className={`${INPUT} w-28 shrink-0`}
                >
                  {Object.entries(UNIT_KELUASAN_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </Medan>
            <Medan label="Price (RM)">
              <HargaInput
                value={lot.hargaRM}
                onChange={(v) => ubahLot({ hargaRM: v })}
                className={INPUT}
                placeholder="e.g. 450k"
                previewClassName="mt-1 text-xs text-black/40"
              />
            </Medan>
            <Medan label="Tenure">
              <select value={lot.tenure} onChange={(e) => ubahLot({ tenure: e.target.value })} className={INPUT}>
                <option value="">—</option>
                {Object.entries(JENIS_HAKMILIK_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Category">
              <select value={lot.kategori} onChange={(e) => ubahLot({ kategori: e.target.value })} className={INPUT}>
                <option value="">—</option>
                {Object.entries(JENIS_TANAH_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Medan>
            <Medan label="Title (grant) no.">
              <input
                value={lot.nomborGeran}
                onChange={(e) => ubahLot({ nomborGeran: e.target.value })}
                placeholder="e.g. GM 12345"
                className={INPUT}
              />
            </Medan>
            <div className="grid grid-cols-2 gap-2">
              <Medan label="Latitude">
                <input
                  inputMode="decimal"
                  value={lot.latitude}
                  onChange={(e) => ubahLot({ latitude: e.target.value })}
                  className={INPUT}
                />
              </Medan>
              <Medan label="Longitude">
                <input
                  inputMode="decimal"
                  value={lot.longitude}
                  onChange={(e) => ubahLot({ longitude: e.target.value })}
                  className={INPUT}
                />
              </Medan>
            </div>
            <Medan label="Notes" className="sm:col-span-2">
              <textarea
                rows={3}
                value={lot.nota}
                onChange={(e) => ubahLot({ nota: e.target.value })}
                placeholder="e.g. Strategic lot next to the main road."
                className={TEXTAREA}
              />
            </Medan>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-black/[0.06]">
            <p className="text-xs text-black/45">Drawing lot boundaries on photos and the map comes with Lot Marker.</p>
            <button
              type="button"
              onClick={padam}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold px-3.5 py-2 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete Lot
            </button>
          </div>
        </div>
      ) : (
        <div className={`${KAD} p-10 flex items-center justify-center text-sm text-black/45`}>
          {form.lots.length === 0 ? "Add a lot to start." : "Select a lot to edit."}
        </div>
      )}
    </div>
  );
}
