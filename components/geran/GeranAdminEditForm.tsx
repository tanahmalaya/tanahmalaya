"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import GambarGeranUpload from "@/components/geran/GambarGeranUpload";
import PolygonEditorPanel from "@/components/geran/polygon/PolygonEditorPanel";
import { formatRM, idVideoYoutube } from "@/lib/geran";
import type { GambarPolygons, VideoPolygonTrack } from "@/lib/geran-polygon";
import { tapisPolygonGambar } from "@/lib/geran-polygon";

const INPUT = "w-full text-sm border border-brand-dark/20 rounded-sm p-2 bg-white";
const LABEL = "block text-xs font-semibold text-brand-dark/70 mb-1.5";

export type GeranEditData = {
  id: string;
  seq: number;
  tajuk: string;
  status: string;
  hargaDimintaSen: number | null;
  hargaPasaranSen: number | null;
  hargaAmbilSen: number | null;
  hargaSiaranSen: number | null;
  catatanRundingan: string | null;
  keterangan: string | null;
  gambarUrls: string[];
  videoYoutubeUrl: string | null;
  gambarPolygons: GambarPolygons;
  videoPolygonTrack: VideoPolygonTrack | null;
};

const rm = (sen: number | null) => (sen === null ? "" : String(sen / 100));

export default function GeranAdminEditForm({ geran }: { geran: GeranEditData }) {
  const router = useRouter();

  const [hargaPasaranRM, setHargaPasaranRM] = useState(rm(geran.hargaPasaranSen));
  const [hargaAmbilRM, setHargaAmbilRM] = useState(rm(geran.hargaAmbilSen));
  const [hargaSiaranRM, setHargaSiaranRM] = useState(rm(geran.hargaSiaranSen));
  const [catatanRundingan, setCatatanRundingan] = useState(geran.catatanRundingan ?? "");
  const [keterangan, setKeterangan] = useState(geran.keterangan ?? "");
  const [gambarUrls, setGambarUrls] = useState<string[]>(geran.gambarUrls);
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState(geran.videoYoutubeUrl ?? "");
  const [gambarPolygons, setGambarPolygons] = useState<GambarPolygons>(geran.gambarPolygons);
  const [videoPolygonTrack, setVideoPolygonTrack] = useState<VideoPolygonTrack | null>(
    geran.videoPolygonTrack
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [berjaya, setBerjaya] = useState(false);

  const ambil = Number(hargaAmbilRM);
  const siaran = Number(hargaSiaranRM);
  const marginSen = ambil > 0 && siaran > 0 ? Math.round((siaran - ambil) * 100) : null;

  const videoId = idVideoYoutube(videoYoutubeUrl);
  const videoTakSah = videoYoutubeUrl.trim().length > 0 && !videoId;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBerjaya(false);
    setLoading(true);
    try {
      const res = await fetch("/api/geran-admin/geran/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geranId: geran.id,
          hargaPasaranRM: hargaPasaranRM ? Number(hargaPasaranRM) : null,
          hargaAmbilRM: hargaAmbilRM ? Number(hargaAmbilRM) : null,
          hargaSiaranRM: hargaSiaranRM ? Number(hargaSiaranRM) : null,
          catatanRundingan: catatanRundingan || null,
          keterangan: keterangan || null,
          gambarUrls,
          videoYoutubeUrl: videoYoutubeUrl || null,
          // Polygon gambar yang dah dibuang tak perlu dihantar langsung -
          // pelayan akan menapisnya juga, tapi elok jangan bawa sampah merentas
          // rangkaian.
          gambarPolygons: tapisPolygonGambar(gambarPolygons, gambarUrls),
          videoPolygonTrack,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal simpan");
      setBerjaya(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="bg-white border border-brand-dark/10 rounded-md p-5">
        <h2 className="font-bold text-brand-dark mb-1">Harga</h2>
        <p className="text-xs text-brand-dark/45 mb-4">
          Hanya <strong>harga siaran</strong> dipapar kepada pembeli di direktori awam. Tiga yang lain
          adalah maklumat dalaman.
        </p>

        <div className="space-y-3">
          <div>
            <label className={LABEL}>Harga penjual minta</label>
            <p className="text-sm font-semibold text-brand-dark">
              {geran.hargaDimintaSen === null ? "— (stok PLT/KJ Land)" : formatRM(geran.hargaDimintaSen)}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Anggaran pasaran (RM)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={hargaPasaranRM}
                onChange={(e) => setHargaPasaranRM(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Harga kita ambil (RM)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={hargaAmbilRM}
                onChange={(e) => setHargaAmbilRM(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Harga siaran (RM)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={hargaSiaranRM}
                onChange={(e) => setHargaSiaranRM(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {marginSen !== null && (
            <div
              className={`text-sm font-semibold rounded-sm px-3 py-2 ${
                marginSen >= 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              Margin: {formatRM(marginSen)}
              {marginSen < 0 && " — harga siaran lebih rendah daripada harga ambil"}
            </div>
          )}

          <div>
            <label className={LABEL}>Nota rundingan (dalaman)</label>
            <textarea
              rows={4}
              value={catatanRundingan}
              onChange={(e) => setCatatanRundingan(e.target.value)}
              placeholder="cth. 12 Sep: penjual minta 150k. Tawar 100k, penjual minta masa fikir."
              className={INPUT}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-brand-dark/10 rounded-md p-5">
        <h2 className="font-bold text-brand-dark mb-1">Media</h2>
        <p className="text-xs text-brand-dark/45 mb-4">
          Gambar dan video drone dirakam oleh PLT/KJ Land. Kedua-duanya dipapar kepada pembeli.
        </p>

        <div className="space-y-4">
          <div>
            <label className={LABEL}>Gambar tanah</label>
            <GambarGeranUpload value={gambarUrls} onChange={setGambarUrls} />
          </div>

          <div>
            <label className={LABEL}>Video drone (pautan YouTube)</label>
            <input
              value={videoYoutubeUrl}
              onChange={(e) => setVideoYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={INPUT}
            />
            {videoTakSah ? (
              <p className="text-xs text-red-600 mt-1">
                Bukan pautan YouTube yang sah. Guna youtube.com/watch?v=… atau youtu.be/…
              </p>
            ) : videoId ? (
              <div className="mt-3 aspect-video rounded-sm overflow-hidden border border-brand-dark/10">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Pratonton video drone"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <p className="text-xs text-brand-dark/40 mt-1">
                Muat naik ke YouTube sebagai <strong>Unlisted</strong>, kemudian tampal pautannya di sini.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL}>Keterangan tanah (dipapar kepada pembeli)</label>
            <textarea
              rows={4}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-brand-dark/10 rounded-md p-5">
        <h2 className="font-bold text-brand-dark mb-1">Sempadan tanah</h2>
        <p className="text-xs text-brand-dark/45 mb-4">
          Lukis polygon sempadan di atas gambar dan video supaya pembeli nampak dengan tepat tanah
          mana yang dijual. Polygon disimpan sebagai koordinat — gambar asal tak diubah dan anda boleh
          sunting semula bila-bila masa.
        </p>

        <PolygonEditorPanel
          gambarUrls={gambarUrls}
          gambarPolygons={gambarPolygons}
          onGambarChange={setGambarPolygons}
          videoTrack={videoPolygonTrack}
          onVideoChange={setVideoPolygonTrack}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {berjaya && <p className="text-emerald-600 text-sm">Perubahan disimpan.</p>}

      <button
        type="submit"
        disabled={loading || videoTakSah}
        className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-4 py-2.5 disabled:opacity-50"
      >
        {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
      </button>
    </form>
  );
}
