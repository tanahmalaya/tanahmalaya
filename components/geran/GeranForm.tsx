"use client";

import { FormEvent, useState } from "react";
import SalinanGeranUpload from "@/components/geran/SalinanGeranUpload";
import HargaInput from "@/components/geran/HargaInput";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_PEMILIKAN_LABEL,
  STATUS_PEMILIKAN_NOTA,
  UNIT_KELUASAN_LABEL,
  STATUS_GERAN_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";
import { GERAN_CARD, GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;
type StatusPemilikan = keyof typeof STATUS_PEMILIKAN_LABEL;
type UnitKeluasan = keyof typeof UNIT_KELUASAN_LABEL;
type StatusGeran = keyof typeof STATUS_GERAN_LABEL;

const STATUS_BADGE: Record<StatusGeran, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DALAM_RUNDINGAN: "bg-blue-50 text-blue-700 border border-blue-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

const CARD = GERAN_CARD;
const INPUT = GERAN_INPUT;
const LABEL = GERAN_LABEL;
const BTN_PRIMARY = GERAN_BTN_PRIMARY;

export type GeranHistoryItem = {
  id: string;
  seq: number;
  tajuk: string;
  negeri: string;
  daerahMukim: string;
  jenisTanah: JenisTanah;
  keluasan: number;
  unitKeluasan: UnitKeluasan;
  hargaDimintaSen: number | null;
  hargaPasaranSen: number | null;
  hargaAmbilSen: number | null;
  hargaSiaranSen: number | null;
  status: StatusGeran;
  catatanAdmin: string | null;
  createdAt: string;
};

export default function GeranForm({
  namaPenjual,
  initialHistory,
}: {
  namaPenjual: string;
  initialHistory: GeranHistoryItem[];
}) {
  const [tajuk, setTajuk] = useState("");
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [daerahMukim, setDaerahMukim] = useState("");
  const [nomborLot, setNomborLot] = useState("");
  const [nomborGeran, setNomborGeran] = useState("");
  const [jenisTanah, setJenisTanah] = useState<JenisTanah>("PERTANIAN");
  const [jenisHakmilik, setJenisHakmilik] = useState<JenisHakmilik>("TIDAK_PASTI");
  // Lalai "Tidak pasti" dengan sengaja - ramai pemilik tak tahu status ini, dan
  // tekaan yang salah lebih memudaratkan pembeli daripada jawapan kosong. Admin
  // mengesahkannya daripada salinan geran semasa semakan.
  const [statusPemilikan, setStatusPemilikan] = useState<StatusPemilikan>("TIDAK_PASTI");
  const [keluasan, setKeluasan] = useState("");
  const [unitKeluasan, setUnitKeluasan] = useState<UnitKeluasan>("EKAR");
  const [hargaRM, setHargaRM] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [salinanGeranUrl, setSalinanGeranUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [justSubmittedSeq, setJustSubmittedSeq] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setJustSubmittedSeq(null);
    setLoading(true);
    try {
      const res = await fetch("/api/geran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tajuk,
          negeri,
          daerahMukim,
          nomborLot: nomborLot || null,
          nomborGeran: nomborGeran || null,
          jenisTanah,
          jenisHakmilik,
          statusPemilikan,
          keluasan: Number(keluasan),
          unitKeluasan,
          hargaRM: Number(hargaRM),
          keterangan: keterangan || null,
          salinanGeranUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit listing");

      setJustSubmittedSeq(data.seq);
      setHistory((prev) => [
        {
          id: data.id,
          seq: data.seq,
          tajuk,
          negeri,
          daerahMukim,
          jenisTanah,
          keluasan: Number(keluasan),
          unitKeluasan,
          hargaDimintaSen: Math.round(Number(hargaRM) * 100),
          hargaPasaranSen: null,
          hargaAmbilSen: null,
          hargaSiaranSen: null,
          status: "MENUNGGU_SEMAKAN",
          catatanAdmin: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTajuk("");
      setDaerahMukim("");
      setNomborLot("");
      setNomborGeran("");
      setKeluasan("");
      setHargaRM("");
      setKeterangan("");
      setSalinanGeranUrl(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={CARD}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[#0E3B2E] font-bold">LIST YOUR LAND</h2>
          <span className="text-xs text-[#0E3B2E]/50">{namaPenjual}</span>
        </div>
        <p className="text-[#0E3B2E]/60 text-sm mb-5">
          Fill in your titled land details and the price you are asking for. PLT reviews the title, checks
          the market value, and will contact you to agree a price before your land is listed. PLT also
          handles the photos and the drone video - you do not need to upload any.
        </p>

        {justSubmittedSeq !== null && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
            Listing #{justSubmittedSeq} submitted successfully. Status: Pending PLT review.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>Listing Title</label>
            <input
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="e.g. 3 Acres Agricultural Land, Jeram Pasu"
              className={INPUT}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>State</label>
              <select value={negeri} onChange={(e) => setNegeri(e.target.value)} className={INPUT}>
                {NEGERI_LIST.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>District / Mukim</label>
              <input
                required
                value={daerahMukim}
                onChange={(e) => setDaerahMukim(e.target.value)}
                placeholder="e.g. Pasir Puteh"
                className={INPUT}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Lot No. (optional)</label>
              <input value={nomborLot} onChange={(e) => setNomborLot(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Grant No. (optional)</label>
              <input value={nomborGeran} onChange={(e) => setNomborGeran(e.target.value)} className={INPUT} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Land Type</label>
              <select value={jenisTanah} onChange={(e) => setJenisTanah(e.target.value as JenisTanah)} className={INPUT}>
                {(Object.keys(JENIS_TANAH_LABEL) as JenisTanah[]).map((k) => (
                  <option key={k} value={k}>
                    {JENIS_TANAH_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Title Type</label>
              <select
                value={jenisHakmilik}
                onChange={(e) => setJenisHakmilik(e.target.value as JenisHakmilik)}
                className={INPUT}
              >
                {(Object.keys(JENIS_HAKMILIK_LABEL) as JenisHakmilik[]).map((k) => (
                  <option key={k} value={k}>
                    {JENIS_HAKMILIK_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Ownership Status</label>
            <select
              value={statusPemilikan}
              onChange={(e) => setStatusPemilikan(e.target.value as StatusPemilikan)}
              className={INPUT}
            >
              {(Object.keys(STATUS_PEMILIKAN_LABEL) as StatusPemilikan[]).map((k) => (
                <option key={k} value={k}>
                  {STATUS_PEMILIKAN_LABEL[k]}
                </option>
              ))}
            </select>
            <p className="text-xs text-black/45 mt-1">
              {STATUS_PEMILIKAN_NOTA[statusPemilikan]} Leave it as Uncertain if you are not sure — PLT
              checks this against your title copy.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Land Size</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={keluasan}
                onChange={(e) => setKeluasan(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Unit</label>
              <select value={unitKeluasan} onChange={(e) => setUnitKeluasan(e.target.value as UnitKeluasan)} className={INPUT}>
                {(Object.keys(UNIT_KELUASAN_LABEL) as UnitKeluasan[]).map((k) => (
                  <option key={k} value={k}>
                    {UNIT_KELUASAN_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Your Asking Price (RM)</label>
              <HargaInput
                required
                value={hargaRM}
                onChange={setHargaRM}
                className={INPUT}
                previewClassName="mt-1 text-xs text-[#0E3B2E]/45"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Additional Description (optional)</label>
            <textarea
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="e.g. Paved road access, near a river, suitable for a durian orchard"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Full Title Copy — PDF (required)</label>
            <p className="text-xs text-[#0E3B2E]/50 mb-2">
              Upload the complete copy of the land title so PLT can verify the lot details, caveats,
              charges and any restriction in interest. Seen by PLT only — it is never shown on the
              public listing.
            </p>
            <SalinanGeranUpload value={salinanGeranUrl} onChange={setSalinanGeranUrl} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !salinanGeranUrl} className={BTN_PRIMARY}>
            {loading ? "SUBMITTING..." : "SUBMIT LISTING"}
          </button>
          {!salinanGeranUrl && (
            <p className="text-xs text-[#0E3B2E]/45">
              Attach the full title copy (PDF) to enable submission.
            </p>
          )}
        </form>
      </div>

      <div className={CARD}>
        <h2 className="text-[#0E3B2E] font-bold mb-4">MY LISTINGS</h2>
        {history.length === 0 ? (
          <p className="text-[#0E3B2E]/50 text-sm">No land listed yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((g) => (
              <div key={g.id} className="border border-black/10 rounded-xl p-4">
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <div>
                    <p className="font-semibold text-sm">
                      #{g.seq} — {g.tajuk}
                    </p>
                    <p className="text-xs text-[#0E3B2E]/50">
                      {g.daerahMukim}, {g.negeri} · {JENIS_TANAH_LABEL[g.jenisTanah]}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[g.status]}`}>
                    {STATUS_GERAN_LABEL[g.status]}
                  </span>
                </div>
                <p className="text-sm text-[#0E3B2E]/70 mb-1.5">{formatKeluasan(g.keluasan, g.unitKeluasan)}</p>

                <dl className="text-xs space-y-1">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#0E3B2E]/45">Your asking price</dt>
                    <dd className="font-semibold text-[#0E3B2E]">
                      {g.hargaDimintaSen === null ? "—" : formatRM(g.hargaDimintaSen)}
                    </dd>
                  </div>
                  {g.hargaPasaranSen !== null && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#0E3B2E]/45">PLT market estimate</dt>
                      <dd className="font-semibold text-[#0E3B2E]">{formatRM(g.hargaPasaranSen)}</dd>
                    </div>
                  )}
                  {g.hargaAmbilSen !== null && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#0E3B2E]/45">Agreed price to you</dt>
                      <dd className="font-bold text-[#0E3B2E]">{formatRM(g.hargaAmbilSen)}</dd>
                    </div>
                  )}
                  {g.hargaSiaranSen !== null && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#0E3B2E]/45">Listed price</dt>
                      <dd className="font-semibold text-[#0E3B2E]">{formatRM(g.hargaSiaranSen)}</dd>
                    </div>
                  )}
                </dl>

                {g.status === "DALAM_RUNDINGAN" && (
                  <p className="text-xs text-blue-700 mt-2">
                    PLT is reviewing the market value and will contact you about the price.
                  </p>
                )}
                {g.status === "DITOLAK" && g.catatanAdmin && (
                  <p className="text-xs text-red-600 mt-1.5">Reason: {g.catatanAdmin}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
