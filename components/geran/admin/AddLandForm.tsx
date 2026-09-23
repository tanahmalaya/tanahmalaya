"use client";

// "Add Land" LANDHUB - maklumat asas sahaja, kemudian terus ke Land Listing
// Editor sebagai DRAFT. Harga awam, lot, media & SEO diisi dalam editor supaya
// ada SATU tempat sahaja untuk menyunting penyenaraian.

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import HargaInput from "@/components/geran/HargaInput";
import GeranIsiPantas from "@/components/geran/GeranIsiPantas";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import type { HasilHurai } from "@/lib/geran/parse";
import {
  JENIS_HAKMILIK_LABEL,
  JENIS_TANAH_LABEL,
  STATUS_PEMILIKAN_LABEL,
  SUMBER_ADMIN_OPTIONS,
  SUMBER_GERAN_LABEL,
  UNIT_KELUASAN_LABEL,
} from "@/lib/geran";
import { INPUT, INPUT_NOMBOR, INPUT_UNIT, KAD, LABEL } from "@/components/geran/admin/editor/types";

type Sumber = (typeof SUMBER_ADMIN_OPTIONS)[number];

function Medan({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export default function AddLandForm() {
  const router = useRouter();
  const [sumber, setSumber] = useState<Sumber>("GT");
  const [tajuk, setTajuk] = useState("");
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [daerahMukim, setDaerahMukim] = useState("");
  const [nomborLot, setNomborLot] = useState("");
  const [jenisTanah, setJenisTanah] = useState("PERTANIAN");
  const [jenisHakmilik, setJenisHakmilik] = useState("TIDAK_PASTI");
  const [statusPemilikan, setStatusPemilikan] = useState("TIDAK_PASTI");
  const [keluasan, setKeluasan] = useState("");
  const [unitKeluasan, setUnitKeluasan] = useState("EKAR");
  const [hargaAmbilRM, setHargaAmbilRM] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState("");

  function isiDariIklan(h: HasilHurai) {
    // Medan null dibiarkan: iklan yang tak sebut sesuatu bukan bukti apa yang
    // admin dah taip itu salah.
    if (h.negeri && NEGERI_LIST.includes(h.negeri)) setNegeri(h.negeri);
    if (h.daerahMukim) setDaerahMukim(h.daerahMukim);
    if (h.nomborLot) setNomborLot(h.nomborLot);
    if (h.jenisTanah) setJenisTanah(h.jenisTanah);
    if (h.jenisHakmilik) setJenisHakmilik(h.jenisHakmilik);
    if (h.statusPemilikan) setStatusPemilikan(h.statusPemilikan);
    if (h.keluasan !== null) setKeluasan(String(h.keluasan));
    if (h.unitKeluasan) setUnitKeluasan(h.unitKeluasan);
    // Harga iklan = harga ambil (dalaman), BUKAN harga awam - salah baca satu
    // digit dari screenshot kabur tak patut sampai ke pembeli.
    if (h.hargaRM !== null) setHargaAmbilRM(String(h.hargaRM));

    if (!tajuk.trim() && h.keluasan !== null && h.unitKeluasan && h.daerahMukim) {
      const unit = UNIT_KELUASAN_LABEL[h.unitKeluasan] ?? "";
      const jenis = h.jenisTanah ? JENIS_TANAH_LABEL[h.jenisTanah] : "Land";
      setTajuk(`${jenis} ${h.keluasan} ${unit} - ${h.daerahMukim}`);
    }
  }

  async function hantar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSibuk(true);
    try {
      const res = await fetch("/api/geran-admin/geran/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sumber,
          tajuk,
          negeri,
          daerahMukim,
          nomborLot: nomborLot || null,
          jenisTanah,
          jenisHakmilik,
          statusPemilikan,
          keluasan: Number(keluasan),
          unitKeluasan,
          hargaAmbilRM: hargaAmbilRM ? Number(hargaAmbilRM) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");
      router.push(`/geran/admin/geran/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSibuk(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
      <form onSubmit={hantar} className={`${KAD} p-5 sm:p-6`}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Medan label="Land name" className="sm:col-span-2">
            <input
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="e.g. Agricultural Land 5.2 Acres - Kluang"
              className={INPUT}
            />
          </Medan>
          <Medan label="Source">
            <select value={sumber} onChange={(e) => setSumber(e.target.value as Sumber)} className={INPUT}>
              {SUMBER_ADMIN_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SUMBER_GERAN_LABEL[s]}
                </option>
              ))}
            </select>
          </Medan>
          <Medan label="Category">
            <select value={jenisTanah} onChange={(e) => setJenisTanah(e.target.value)} className={INPUT}>
              {Object.entries(JENIS_TANAH_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Medan>
          <Medan label="State">
            <select value={negeri} onChange={(e) => setNegeri(e.target.value)} className={INPUT}>
              {NEGERI_LIST.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Medan>
          <Medan label="District">
            <input required value={daerahMukim} onChange={(e) => setDaerahMukim(e.target.value)} className={INPUT} />
          </Medan>
          <Medan label="Land size">
            <div className="flex gap-2">
              <input
                required
                type="number"
                step="any"
                min="0"
                value={keluasan}
                onChange={(e) => setKeluasan(e.target.value)}
                className={INPUT_NOMBOR}
              />
              <select
                value={unitKeluasan}
                onChange={(e) => setUnitKeluasan(e.target.value)}
                className={INPUT_UNIT}
              >
                {Object.entries(UNIT_KELUASAN_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </Medan>
          <Medan label="Lot no. (optional)">
            <input value={nomborLot} onChange={(e) => setNomborLot(e.target.value)} className={INPUT} />
          </Medan>
          <Medan label="Tenure">
            <select value={jenisHakmilik} onChange={(e) => setJenisHakmilik(e.target.value)} className={INPUT}>
              {Object.entries(JENIS_HAKMILIK_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Medan>
          <Medan label="Ownership">
            <select value={statusPemilikan} onChange={(e) => setStatusPemilikan(e.target.value)} className={INPUT}>
              {Object.entries(STATUS_PEMILIKAN_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Medan>
          <Medan label="Our take price (RM, internal)" className="sm:col-span-2">
            <HargaInput
              value={hargaAmbilRM}
              onChange={setHargaAmbilRM}
              className={INPUT}
              placeholder="e.g. 450k"
              previewClassName="mt-1 text-xs text-black/40"
            />
          </Medan>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-black/[0.06]">
          <p className="text-xs text-black/45">Saved as a Draft. Add the listing price, lots and photos next.</p>
          <button
            type="submit"
            disabled={sibuk}
            className="inline-flex items-center gap-1.5 h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {sibuk ? <Loader2 size={16} className="animate-spin" /> : null}
            Create &amp; Continue <ArrowRight size={16} />
          </button>
        </div>
      </form>

      <div className={`${KAD} p-4`}>
        <GeranIsiPantas onIsi={isiDariIklan} />
      </div>
    </div>
  );
}
