"use client";

import { FormEvent, useState } from "react";
import GambarGeranUpload from "@/components/geran/GambarGeranUpload";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  UNIT_KELUASAN_LABEL,
  STATUS_GERAN_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";
import { GERAN_CARD, GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;
type UnitKeluasan = keyof typeof UNIT_KELUASAN_LABEL;
type StatusGeran = keyof typeof STATUS_GERAN_LABEL;

const STATUS_BADGE: Record<StatusGeran, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
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
  hargaSen: number;
  mintaDroneSurvey: boolean;
  status: StatusGeran;
  catatanAdmin: string | null;
  createdAt: string;
};

export default function GeranForm({
  namaPenjual,
  initialHistory,
  isRen,
}: {
  namaPenjual: string;
  initialHistory: GeranHistoryItem[];
  isRen: boolean;
}) {
  const [tajuk, setTajuk] = useState("");
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [daerahMukim, setDaerahMukim] = useState("");
  const [nomborLot, setNomborLot] = useState("");
  const [nomborGeran, setNomborGeran] = useState("");
  const [jenisTanah, setJenisTanah] = useState<JenisTanah>("PERTANIAN");
  const [jenisHakmilik, setJenisHakmilik] = useState<JenisHakmilik>("TIDAK_PASTI");
  const [keluasan, setKeluasan] = useState("");
  const [unitKeluasan, setUnitKeluasan] = useState<UnitKeluasan>("EKAR");
  const [hargaRM, setHargaRM] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [gambarUrls, setGambarUrls] = useState<string[]>([]);
  const [mintaDroneSurvey, setMintaDroneSurvey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [justSubmittedSeq, setJustSubmittedSeq] = useState<number | null>(null);
  const [justSubmittedStatus, setJustSubmittedStatus] = useState<StatusGeran>("MENUNGGU_SEMAKAN");

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
          keluasan: Number(keluasan),
          unitKeluasan,
          hargaRM: Number(hargaRM),
          keterangan: keterangan || null,
          gambarUrls,
          mintaDroneSurvey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit listing");

      const status: StatusGeran = data.status ?? "MENUNGGU_SEMAKAN";
      setJustSubmittedSeq(data.seq);
      setJustSubmittedStatus(status);
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
          hargaSen: Math.round(Number(hargaRM) * 100),
          mintaDroneSurvey,
          status,
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
      setGambarUrls([]);
      setMintaDroneSurvey(false);
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
          {isRen
            ? "You're a PLT-registered REN - your listing is approved automatically and goes straight to the Geran directory."
            : "Fill in your titled land details. Your listing will be reviewed and placed under a PLT-chosen REN before it appears in the Geran directory."}
        </p>

        {justSubmittedSeq !== null && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
            Listing #{justSubmittedSeq} submitted successfully. Status:{" "}
            {justSubmittedStatus === "DISAHKAN" ? "Approved (REN auto-approve)" : "Pending PLT review"}.
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
              <label className={LABEL}>Asking Price (RM)</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={hargaRM}
                onChange={(e) => setHargaRM(e.target.value)}
                className={INPUT}
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
            <label className={LABEL}>Land Photos (optional)</label>
            <GambarGeranUpload value={gambarUrls} onChange={setGambarUrls} />
          </div>

          <label className="flex items-start gap-3 bg-[#F7F5F1] rounded-xl p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mintaDroneSurvey}
              onChange={(e) => setMintaDroneSurvey(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-semibold">Request Drone Survey (optional)</span>
              <br />
              <span className="text-[#0E3B2E]/50 text-xs">
                PLT will contact you to schedule a drone pilot to capture aerial photos/footage of this
                land lot.
              </span>
            </span>
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className={BTN_PRIMARY}>
            {loading ? "SUBMITTING..." : "SUBMIT LISTING"}
          </button>
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
                <p className="text-sm text-[#0E3B2E]/70 mb-1">{formatKeluasan(g.keluasan, g.unitKeluasan)}</p>
                <p className="font-bold text-[#0E3B2E] text-sm">{formatRM(g.hargaSen)}</p>
                {g.mintaDroneSurvey && (
                  <p className="text-xs text-blue-600 mt-1.5">📹 Drone survey request sent</p>
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
