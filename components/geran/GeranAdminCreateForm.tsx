"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import GambarGeranUpload from "@/components/geran/GambarGeranUpload";
import SalinanGeranUpload from "@/components/geran/SalinanGeranUpload";
import HargaInput from "@/components/geran/HargaInput";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import StatusPemilikanBadge from "@/components/geran/StatusPemilikanBadge";
import GeranIsiPantas from "@/components/geran/GeranIsiPantas";
import type { HasilHurai } from "@/lib/geran/parse";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_PEMILIKAN_LABEL,
  UNIT_KELUASAN_LABEL,
  SUMBER_GERAN_LABEL,
  SUMBER_ADMIN_OPTIONS,
  formatRM,
} from "@/lib/geran";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;
type StatusPemilikan = keyof typeof STATUS_PEMILIKAN_LABEL;
type UnitKeluasan = keyof typeof UNIT_KELUASAN_LABEL;
type Sumber = (typeof SUMBER_ADMIN_OPTIONS)[number];

const INPUT = "w-full text-sm border border-brand-dark/20 rounded-sm p-2 bg-white";
const LABEL = "block text-xs font-semibold text-brand-dark/70 mb-1.5";

export default function GeranAdminCreateForm() {
  const router = useRouter();

  const [sumber, setSumber] = useState<Sumber>("PLT");
  const [namaPenjual, setNamaPenjual] = useState("");
  const [telefonPenjual, setTelefonPenjual] = useState("");
  const [emelPenjual, setEmelPenjual] = useState("");
  const [tajuk, setTajuk] = useState("");
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [daerahMukim, setDaerahMukim] = useState("");
  const [nomborLot, setNomborLot] = useState("");
  const [nomborGeran, setNomborGeran] = useState("");
  const [jenisTanah, setJenisTanah] = useState<JenisTanah>("PERTANIAN");
  const [jenisHakmilik, setJenisHakmilik] = useState<JenisHakmilik>("TIDAK_PASTI");
  const [statusPemilikan, setStatusPemilikan] = useState<StatusPemilikan>("TIDAK_PASTI");
  const [keluasan, setKeluasan] = useState("");
  const [unitKeluasan, setUnitKeluasan] = useState<UnitKeluasan>("EKAR");
  const [hargaAmbilRM, setHargaAmbilRM] = useState("");
  const [hargaSiaranRM, setHargaSiaranRM] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [gambarUrls, setGambarUrls] = useState<string[]>([]);
  const [salinanGeranUrl, setSalinanGeranUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [berjayaSeq, setBerjayaSeq] = useState<number | null>(null);

  function isiDariIklan(h: HasilHurai) {
    // Medan null dibiarkan sahaja, tidak dikosongkan: admin mungkin sudah
    // menaip sesuatu, dan iklan yang tak menyebut sesuatu bukan bukti bahawa
    // apa yang ditaip itu salah.
    if (h.negeri && NEGERI_LIST.includes(h.negeri)) setNegeri(h.negeri);
    if (h.daerahMukim) setDaerahMukim(h.daerahMukim);
    if (h.nomborLot) setNomborLot(h.nomborLot);
    if (h.jenisTanah) setJenisTanah(h.jenisTanah as JenisTanah);
    if (h.jenisHakmilik) setJenisHakmilik(h.jenisHakmilik as JenisHakmilik);
    if (h.statusPemilikan) setStatusPemilikan(h.statusPemilikan as StatusPemilikan);
    if (h.keluasan !== null) setKeluasan(String(h.keluasan));
    if (h.unitKeluasan) setUnitKeluasan(h.unitKeluasan as UnitKeluasan);

    // Harga iklan masuk ke "harga kita ambil" (dalaman), TIDAK ke harga siaran.
    // Harga siaran itu yang sampai kepada pembeli dan mesti ditetapkan admin
    // dengan sengaja - salah baca satu digit daripada screenshot yang kabur
    // tak sepatutnya boleh tersiar terus ke direktori awam.
    if (h.hargaRM !== null) setHargaAmbilRM(String(h.hargaRM));

    if (!tajuk.trim() && h.keluasan !== null && h.unitKeluasan && h.daerahMukim) {
      const unit = h.unitKeluasan === "EKAR" ? "ekar" : h.unitKeluasan === "HEKTAR" ? "hektar" : "kp";
      setTajuk(`${h.keluasan} ${unit} tanah di ${h.daerahMukim}`);
    }
  }


  const ambil = Number(hargaAmbilRM);
  const siaran = Number(hargaSiaranRM);
  const marginSen = ambil > 0 && siaran > 0 ? Math.round((siaran - ambil) * 100) : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBerjayaSeq(null);
    setLoading(true);
    try {
      const res = await fetch("/api/geran-admin/geran/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sumber,
          namaPenjual,
          telefonPenjual,
          emelPenjual,
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
          hargaAmbilRM: hargaAmbilRM ? Number(hargaAmbilRM) : null,
          hargaSiaranRM: Number(hargaSiaranRM),
          keterangan: keterangan || null,
          gambarUrls,
          salinanGeranUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal tambah penyenaraian");

      setBerjayaSeq(data.seq);
      setTajuk("");
      setDaerahMukim("");
      setNomborLot("");
      setNomborGeran("");
      setKeluasan("");
      setHargaAmbilRM("");
      setHargaSiaranRM("");
      setKeterangan("");
      setGambarUrls([]);
      setSalinanGeranUrl(null);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-brand-dark/10 rounded-md p-5 max-w-2xl">
      <p className="text-sm text-brand-dark/60 mb-5">
        Untuk stok tanah GT sendiri dan tanah dari KJ Land consultant. Penyenaraian yang ditambah di sini
        terus disahkan dan muncul dalam direktori awam tanpa perlu semakan.
      </p>

      {berjayaSeq !== null && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-md p-3">
          Penyenaraian #{berjayaSeq} berjaya ditambah dan sudah tersiar di direktori.
        </div>
      )}

      <div className="mb-5">
        <GeranIsiPantas onIsi={isiDariIklan} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Sumber</label>
          <select value={sumber} onChange={(e) => setSumber(e.target.value as Sumber)} className={INPUT}>
            {SUMBER_ADMIN_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SUMBER_GERAN_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="border border-brand-dark/10 rounded-md p-4">
          <legend className="text-xs font-semibold text-brand-dark/70 px-1">Maklumat hubungan</legend>
          <p className="text-xs text-brand-dark/45 mb-3">
            Hubungan pejabat GT atau perunding KJ Land — bukan tuan tanah. Hanya dipapar dalam dashboard
            admin ini.
          </p>
          <div className="space-y-3">
            <div>
              <label className={LABEL}>Nama</label>
              <input
                required
                value={namaPenjual}
                onChange={(e) => setNamaPenjual(e.target.value)}
                placeholder="cth. Pejabat GT"
                className={INPUT}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Telefon</label>
                <input
                  required
                  value={telefonPenjual}
                  onChange={(e) => setTelefonPenjual(e.target.value)}
                  placeholder="cth. 0123456789"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Emel</label>
                <input
                  required
                  type="email"
                  value={emelPenjual}
                  onChange={(e) => setEmelPenjual(e.target.value)}
                  placeholder="cth. info@gerantanah.com"
                  className={INPUT}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div>
          <label className={LABEL}>Tajuk penyenaraian</label>
          <input
            required
            value={tajuk}
            onChange={(e) => setTajuk(e.target.value)}
            placeholder="cth. 3 Ekar Tanah Pertanian, Jeram Pasu"
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
              placeholder="cth. Pasir Puteh"
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
            <label className={LABEL}>Jenis tanah</label>
            <select
              value={jenisTanah}
              onChange={(e) => setJenisTanah(e.target.value as JenisTanah)}
              className={INPUT}
            >
              {(Object.keys(JENIS_TANAH_LABEL) as JenisTanah[]).map((k) => (
                <option key={k} value={k}>
                  {JENIS_TANAH_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Jenis hakmilik</label>
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
          <div>
            <label className={LABEL}>
              Status pemilikan <StatusPemilikanBadge status={statusPemilikan} saiz="kecil" />
            </label>
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
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}>Keluasan</label>
            <input
              required
              type="number"
              min="0"
              step="any"
              value={keluasan}
              onChange={(e) => setKeluasan(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Unit</label>
            <select
              value={unitKeluasan}
              onChange={(e) => setUnitKeluasan(e.target.value as UnitKeluasan)}
              className={INPUT}
            >
              {(Object.keys(UNIT_KELUASAN_LABEL) as UnitKeluasan[]).map((k) => (
                <option key={k} value={k}>
                  {UNIT_KELUASAN_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Harga kita ambil (RM) — pilihan</label>
            <HargaInput value={hargaAmbilRM} onChange={setHargaAmbilRM} className={INPUT} />
            <p className="text-xs text-brand-dark/40 mt-1">Kos GT/KJ Land. Tak dipapar kepada pembeli.</p>
          </div>
          <div>
            <label className={LABEL}>Harga siaran (RM)</label>
            <HargaInput required value={hargaSiaranRM} onChange={setHargaSiaranRM} className={INPUT} />
            <p className="text-xs text-brand-dark/40 mt-1">Harga yang pembeli nampak di direktori.</p>
          </div>
        </div>

        {marginSen !== null && (
          <p
            className={`text-sm font-semibold ${marginSen >= 0 ? "text-emerald-700" : "text-red-600"}`}
          >
            Margin: {formatRM(marginSen)}
          </p>
        )}

        <div>
          <label className={LABEL}>Keterangan (pilihan)</label>
          <textarea
            rows={4}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Gambar tanah (pilihan)</label>
          <GambarGeranUpload value={gambarUrls} onChange={setGambarUrls} />
        </div>

        <div>
          <label className={LABEL}>Salinan penuh geran - PDF (pilihan)</label>
          <p className="text-xs text-brand-dark/45 mb-2">
            Untuk rujukan kaveat, gadaian & sekatan kepentingan. Dipapar dalam dashboard admin
            sahaja, tidak pernah muncul pada penyenaraian awam.
          </p>
          <SalinanGeranUpload value={salinanGeranUrl} onChange={setSalinanGeranUrl} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-4 py-2.5 disabled:opacity-50"
        >
          {loading ? "MENYIMPAN..." : "TAMBAH PENYENARAIAN"}
        </button>
      </form>
    </div>
  );
}
