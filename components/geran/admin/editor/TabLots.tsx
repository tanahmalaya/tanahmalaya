"use client";

import { useState } from "react";
import { LandPlot, List, PenTool, Plus, Trash2 } from "lucide-react";
import { UNIT_KELUASAN_LABEL, formatRM } from "@/lib/geran";
import { LotFields, LotStatusBadge, STATUS_LOT, lotKosong } from "./lotShared";
import LotMarker from "@/components/geran/admin/lotmarker/LotMarker";
import { KAD, type EditorForm, type LotForm, type StatusLotKey, type UbahForm } from "./types";

function SenaraiLot({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  const [pilihan, setPilihan] = useState<string | null>(form.lots[0]?.kunci ?? null);
  const lot = form.lots.find((l) => l.kunci === pilihan) ?? null;

  function ubahLot(perubahan: Partial<LotForm>) {
    ubah({ lots: form.lots.map((l) => (l.kunci === pilihan ? { ...l, ...perubahan } : l)) });
  }

  function tambah() {
    const baru = lotKosong(form);
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
                  l.kunci === pilihan ? "border-emerald-600/50 bg-emerald-50/60" : "border-black/[0.07] hover:bg-black/[0.02]"
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
            <LotStatusBadge status={lot.status} />
          </div>
          <LotFields lot={lot} ubahLot={ubahLot} />
          <div className="flex justify-end mt-6 pt-5 border-t border-black/[0.06]">
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

export default function TabLots({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  // Marker jadi paparan lalai - itulah cara utama lot dicipta, sama ada atas
  // gambar drone atau terus atas peta satelit.
  const [paparan, setPaparan] = useState<"marker" | "senarai">("marker");

  const butang = (nilai: typeof paparan, label: string, Ikon: typeof List) => (
    <button
      type="button"
      onClick={() => setPaparan(nilai)}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        paparan === nilai ? "bg-white shadow-sm text-black" : "text-black/50 hover:text-black/80"
      }`}
    >
      <Ikon size={15} /> {label}
    </button>
  );

  return (
    <div>
      <div className="inline-flex rounded-lg bg-black/[0.05] p-1 mb-4">
        {butang("marker", "Lot Marker", PenTool)}
        {butang("senarai", "Lot List", List)}
      </div>
      {paparan === "marker" ? <LotMarker form={form} ubah={ubah} /> : <SenaraiLot form={form} ubah={ubah} />}
    </div>
  );
}
