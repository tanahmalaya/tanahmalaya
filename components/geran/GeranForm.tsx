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
      if (!res.ok) throw new Error(data.error || "Gagal hantar penyenaraian");

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
          <h2 className="text-[#0E3B2E] font-bold">SENARAIKAN TANAH ANDA</h2>
          <span className="text-xs text-[#0E3B2E]/50">{namaPenjual}</span>
        </div>
        <p className="text-[#0E3B2E]/60 text-sm mb-5">
          {isRen
            ? "Anda REN berdaftar PLT - penyenaraian anda disahkan automatik & terus dipaparkan dalam direktori Geran."
            : "Isi butiran tanah bergeran anda. Penyenaraian akan disemak & diletakkan di bawah REN pilihan PLT sebelum dipaparkan dalam direktori Geran."}
        </p>

        {justSubmittedSeq !== null && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
            Penyenaraian #{justSubmittedSeq} berjaya dihantar. Status:{" "}
            {justSubmittedStatus === "DISAHKAN" ? "Disahkan (auto-approve REN)" : "Menunggu semakan PLT"}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>Tajuk Penyenaraian</label>
            <input
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Contoh: 3 Ekar Tanah Pertanian, Jeram Pasu"
              className={INPUT}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Negeri</label>
              <select value={negeri} onChange={(e) => setNegeri(e.target.value)} className={INPUT}>
                {NEGERI_LIST.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Daerah / Mukim</label>
              <input
                required
                value={daerahMukim}
                onChange={(e) => setDaerahMukim(e.target.value)}
                placeholder="Contoh: Pasir Puteh"
                className={INPUT}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>No. Lot (pilihan)</label>
              <input value={nomborLot} onChange={(e) => setNomborLot(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>No. Geran (pilihan)</label>
              <input value={nomborGeran} onChange={(e) => setNomborGeran(e.target.value)} className={INPUT} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Jenis Tanah</label>
              <select value={jenisTanah} onChange={(e) => setJenisTanah(e.target.value as JenisTanah)} className={INPUT}>
                {(Object.keys(JENIS_TANAH_LABEL) as JenisTanah[]).map((k) => (
                  <option key={k} value={k}>
                    {JENIS_TANAH_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Jenis Hakmilik</label>
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
              <label className={LABEL}>Keluasan</label>
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
              <label className={LABEL}>Harga Tawaran (RM)</label>
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
            <label className={LABEL}>Keterangan Tambahan (pilihan)</label>
            <textarea
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Akses jalan tar, berhampiran sungai, sesuai untuk kebun durian"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Gambar Tanah (pilihan)</label>
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
              <span className="font-semibold">Minta Drone Survey (pilihan)</span>
              <br />
              <span className="text-[#0E3B2E]/50 text-xs">
                PLT akan hubungi anda untuk jadualkan juruterbang drone bagi tangkap gambar/footage udara
                lot tanah ini.
              </span>
            </span>
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className={BTN_PRIMARY}>
            {loading ? "MENGHANTAR..." : "HANTAR PENYENARAIAN"}
          </button>
        </form>
      </div>

      <div className={CARD}>
        <h2 className="text-[#0E3B2E] font-bold mb-4">SENARAI GERAN SAYA</h2>
        {history.length === 0 ? (
          <p className="text-[#0E3B2E]/50 text-sm">Belum ada tanah disenaraikan.</p>
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
                  <p className="text-xs text-blue-600 mt-1.5">📹 Permintaan drone survey dihantar</p>
                )}
                {g.status === "DITOLAK" && g.catatanAdmin && (
                  <p className="text-xs text-red-600 mt-1.5">Sebab: {g.catatanAdmin}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
