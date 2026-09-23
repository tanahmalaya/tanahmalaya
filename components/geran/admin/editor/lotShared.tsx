"use client";

// Bahagian lot yang dikongsi senarai lot (TabLots) & Lot Marker - fail
// berasingan supaya kedua-duanya tak saling import.

import HargaInput from "@/components/geran/HargaInput";
import { JENIS_HAKMILIK_LABEL, JENIS_TANAH_LABEL, UNIT_KELUASAN_LABEL } from "@/lib/geran";
import {
  INPUT,
  INPUT_NOMBOR,
  INPUT_UNIT,
  LABEL,
  TEXTAREA,
  type EditorForm,
  type LotForm,
  type StatusLotKey,
} from "./types";

// Warna status lot - dikongsi senarai lot, Lot Marker & overlay awam supaya
// hijau/kuning/merah bermaksud perkara yang sama di mana-mana.
export const STATUS_LOT: Record<StatusLotKey, { label: string; badge: string; dot: string; hex: string }> = {
  AVAILABLE: { label: "Available", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", hex: "#10B981" },
  RESERVED: { label: "Reserved", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", hex: "#F59E0B" },
  SOLD: { label: "Sold", badge: "bg-red-50 text-red-600 ring-red-200", dot: "bg-red-500", hex: "#EF4444" },
};

let kiraanLotBaru = 0;

// Nama lot seterusnya: Lot A, Lot B, ... - langkau nama yang sudah dipakai
// supaya lot yang dipadam di tengah tak menghasilkan dua "Lot C".
export function namaLotSeterusnya(lots: LotForm[]): string {
  const dipakai = new Set(lots.map((l) => l.noLot.trim().toLowerCase()));
  for (let i = 0; i < 26 * 27; i += 1) {
    const huruf = i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`;
    if (!dipakai.has(`lot ${huruf}`.toLowerCase())) return `Lot ${huruf}`;
  }
  return `Lot ${lots.length + 1}`;
}

export function lotKosong(form: EditorForm): LotForm {
  kiraanLotBaru += 1;
  return {
    kunci: `baru-${Date.now()}-${kiraanLotBaru}`,
    id: null,
    noLot: namaLotSeterusnya(form.lots),
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

export function LotStatusBadge({ status }: { status: StatusLotKey }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_LOT[status].badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LOT[status].dot}`} />
      {STATUS_LOT[status].label}
    </span>
  );
}

// Medan sunting satu lot. `padat` = satu lajur untuk panel sisi Lot Marker.
export function LotFields({
  lot,
  ubahLot,
  padat = false,
}: {
  lot: LotForm;
  ubahLot: (p: Partial<LotForm>) => void;
  padat?: boolean;
}) {
  return (
    <div className={`grid gap-3.5 ${padat ? "" : "sm:grid-cols-2 gap-4"}`}>
      <Medan label="Lot no. / name">
        <input value={lot.noLot} onChange={(e) => ubahLot({ noLot: e.target.value })} className={INPUT} />
      </Medan>
      <Medan label="Status">
        <select value={lot.status} onChange={(e) => ubahLot({ status: e.target.value as StatusLotKey })} className={INPUT}>
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
            className={INPUT_NOMBOR}
          />
          <select value={lot.unitKeluasan} onChange={(e) => ubahLot({ unitKeluasan: e.target.value })} className={INPUT_UNIT}>
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
          <input inputMode="decimal" value={lot.latitude} onChange={(e) => ubahLot({ latitude: e.target.value })} className={INPUT} />
        </Medan>
        <Medan label="Longitude">
          <input inputMode="decimal" value={lot.longitude} onChange={(e) => ubahLot({ longitude: e.target.value })} className={INPUT} />
        </Medan>
      </div>
      <Medan label="Notes" className={padat ? "" : "sm:col-span-2"}>
        <textarea
          rows={3}
          value={lot.nota}
          onChange={(e) => ubahLot({ nota: e.target.value })}
          placeholder="e.g. Strategic lot next to the main road."
          className={TEXTAREA}
        />
      </Medan>
    </div>
  );
}
