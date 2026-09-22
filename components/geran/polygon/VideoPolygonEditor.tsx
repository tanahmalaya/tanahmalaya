"use client";

// Tab "Video" dalam editor polygon admin.
//
// Fail video TIDAK PERNAH dimuat naik ke mana-mana. Admin pilih MP4 dari
// komputer, ia dibuka melalui URL.createObjectURL dan semua kerja jejak berlaku
// dalam pelayar. Yang disimpan ke pangkalan data hanyalah senarai keyframe
// (masa + bucu ternormal) - beberapa kilobait, kos storan/bandwidth sifar.
//
// Aliran kerjanya:
//   1. Pilih fail, gerak ke saat yang jelas, lukis sempadan tanah.
//   2. "Jejak dari sini" - optical flow ikut tanah bingkai demi bingkai dan
//      hasilkan keyframe sepanjang jalan.
//   3. Kalau polygon mula tersasar, admin pause, betulkan bucu (itu jadi
//      keyframe baharu) dan jejak semula dari situ.
//   4. Simpan. Admin muat naik fail YANG SAMA ke YouTube seperti biasa; halaman
//      butiran melukis semula polygon atas embed itu mengikut masa main.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_SAIZ_VIDEO_BYTES, formatSaizFail } from "@/lib/geran";
import type { KeyframePolygon, Titik, VideoPolygonTrack } from "@/lib/geran/polygon";
import { MAX_KEYFRAME_TRACK, bundarkanTitik, mampatKeyframes, polygonPadaMasa } from "@/lib/geran/polygon";
import {
  LEBAR_KERJA_MAKS,
  anggarTransform,
  binaPiramid,
  gunaAffin,
  imageDataKeGray,
  jejakTitikDuaHala,
  kesanCiri,
  titikDalamPolygon,
  type Piramid,
  type TitikPx,
} from "@/lib/tracking/opticalFlow";
import PolygonCanvas from "./PolygonCanvas";

// Berapa kali sesaat kita ambil sampel semasa auto-jejak. Lebih tinggi = lebih
// tepat tapi lebih lambat; 8 memadai untuk gerakan drone yang licin, dan
// interpolasi linear melicinkan baki antara sampel.
const PILIHAN_KADAR = [4, 8, 12];
const CIRI_MINIMUM = 40;

type Meta = { durasi: number; lebar: number; tinggi: number };
type StatusJejak = { berjalan: boolean; progres: number; mesej: string };

const kosong: StatusJejak = { berjalan: false, progres: 0, mesej: "" };

function formatMasa(saat: number): string {
  const s = Math.max(0, saat);
  const m = Math.floor(s / 60);
  const baki = s - m * 60;
  return `${m}:${baki.toFixed(1).padStart(4, "0")}`;
}

export default function VideoPolygonEditor({
  value,
  onChange,
}: {
  value: VideoPolygonTrack | null;
  onChange: (track: VideoPolygonTrack | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const kanvasRef = useRef<HTMLCanvasElement | null>(null);
  const batalRef = useRef(false);

  const [failUrl, setFailUrl] = useState<string | null>(null);
  const [namaFail, setNamaFail] = useState<string | null>(value?.namaFail ?? null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [masa, setMasa] = useState(0);
  const [points, setPoints] = useState<Titik[]>([]);
  const [keyframes, setKeyframes] = useState<KeyframePolygon[]>(value?.keyframes ?? []);
  const [offsetMasa, setOffsetMasa] = useState(value?.offsetMasa ?? 0);
  const [label, setLabel] = useState(value?.label ?? "");
  const [kadar, setKadar] = useState(8);
  const [status, setStatus] = useState<StatusJejak>(kosong);
  const [sedangMain, setSedangMain] = useState(false);

  const durasi = meta?.durasi ?? value?.durasi ?? 0;

  // ---------- Hantar perubahan ke borang induk ----------
  useEffect(() => {
    if (keyframes.length === 0) {
      onChange(null);
      return;
    }
    onChange({
      version: 1,
      namaFail,
      durasi: durasi || value?.durasi || 0,
      lebar: meta?.lebar ?? value?.lebar ?? 1920,
      tinggi: meta?.tinggi ?? value?.tinggi ?? 1080,
      offsetMasa,
      label: label.trim() || null,
      keyframes,
    });
    // `onChange` datang dari borang induk dan stabil; `value` sengaja tak
    // disenaraikan supaya kemas kini kita sendiri tak mencetus gelung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyframes, namaFail, durasi, meta, offsetMasa, label]);

  useEffect(() => {
    return () => {
      if (failUrl) URL.revokeObjectURL(failUrl);
    };
  }, [failUrl]);

  // ---------- Muat fail tempatan ----------
  function pilihFail(fail: File | null) {
    if (!fail) return;

    if (fail.size > MAX_SAIZ_VIDEO_BYTES) {
      setStatus({
        berjalan: false,
        progres: 0,
        mesej:
          `Fail ini ${formatSaizFail(fail.size)}, melebihi had ${formatSaizFail(MAX_SAIZ_VIDEO_BYTES)}. ` +
          "Jejak polygon hanya bekerja pada 640px lebar, jadi rakaman 4K penuh tak memberi ketepatan tambahan — " +
          "ia cuma melambatkan setiap lompatan bingkai. Potong bahagian yang perlu sahaja, atau eksport semula pada 1080p.",
      });
      return;
    }

    batalRef.current = true;
    setStatus(kosong);
    if (failUrl) URL.revokeObjectURL(failUrl);
    setFailUrl(URL.createObjectURL(fail));
    setNamaFail(fail.name);
    setMeta(null);
    setMasa(0);
  }

  function handleMetadata() {
    const v = videoRef.current;
    if (!v) return;
    const baru = { durasi: v.duration, lebar: v.videoWidth, tinggi: v.videoHeight };
    setMeta(baru);
    kanvasRef.current = document.createElement("canvas");
    const lebarKerja = Math.min(LEBAR_KERJA_MAKS, baru.lebar);
    kanvasRef.current.width = lebarKerja;
    kanvasRef.current.height = Math.max(2, Math.round((lebarKerja * baru.tinggi) / baru.lebar));
    // Pulihkan pandangan pada keyframe pertama supaya admin nampak terus kerja
    // yang tersimpan, bukan bingkai sifar yang kosong.
    const mula = keyframes[0]?.t ?? 0;
    v.currentTime = Math.min(mula, baru.durasi);
  }

  // ---------- Bantuan bingkai ----------
  const pergiKe = useCallback((t: number) => {
    return new Promise<void>((resolve) => {
      const v = videoRef.current;
      if (!v) {
        resolve();
        return;
      }
      const siap = () => {
        v.removeEventListener("seeked", siap);
        resolve();
      };
      v.addEventListener("seeked", siap);
      v.currentTime = t;
    });
  }, []);

  const bacaBingkai = useCallback(() => {
    const v = videoRef.current;
    const k = kanvasRef.current;
    if (!v || !k) return null;
    const ctx = k.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, k.width, k.height);
    const gray = imageDataKeGray(ctx.getImageData(0, 0, k.width, k.height));
    return { gray, piramid: binaPiramid(gray), lebar: k.width, tinggi: k.height };
  }, []);

  // ---------- Keyframe ----------
  const upsertKeyframe = useCallback((t: number, titik: Titik[]) => {
    setKeyframes((lama) => {
      const bundar = bundarkanTitik(titik);
      // Satu keyframe setiap ~1/50 saat sudah lebih halus daripada yang mata
      // boleh bezakan; tanpa toleransi ini, menyeret bucu akan cipta longgokan
      // keyframe yang hampir serupa pada masa yang sama.
      const idx = lama.findIndex((kf) => Math.abs(kf.t - t) < 0.02);
      if (idx >= 0) {
        const salin = [...lama];
        salin[idx] = { t: salin[idx].t, points: bundar };
        return salin;
      }
      return [...lama, { t, points: bundar }].sort((a, b) => a.t - b.t);
    });
  }, []);

  function handleSuntingan(baru: Titik[]) {
    setPoints(baru);
    if (baru.length >= 3) upsertKeyframe(masa, baru);
    else setKeyframes((lama) => lama.filter((kf) => Math.abs(kf.t - masa) >= 0.02));
  }

  // Segerakkan polygon dipapar dengan kedudukan masa semasa.
  const trackSemasa = useMemo<VideoPolygonTrack | null>(() => {
    if (keyframes.length === 0) return null;
    return {
      version: 1,
      namaFail,
      durasi,
      lebar: meta?.lebar ?? 1920,
      tinggi: meta?.tinggi ?? 1080,
      offsetMasa: 0, // offset hanya untuk halaman awam, bukan pratonton editor
      label: null,
      keyframes,
    };
  }, [keyframes, namaFail, durasi, meta]);

  const segerakPolygon = useCallback(
    (t: number) => {
      if (!trackSemasa) {
        setPoints([]);
        return;
      }
      setPoints(polygonPadaMasa(trackSemasa, t) ?? []);
    },
    [trackSemasa]
  );

  async function lompatKe(t: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setSedangMain(false);
    await pergiKe(Math.max(0, Math.min(durasi, t)));
    setMasa(v.currentTime);
    segerakPolygon(v.currentTime);
  }

  // Semasa pratonton dimainkan, polygon kena ikut masa main. `timeupdate`
  // terlalu jarang (~4/saat) untuk ini, jadi kita guna rAF.
  useEffect(() => {
    if (!sedangMain) return undefined;
    let id = 0;
    const gelung = () => {
      const v = videoRef.current;
      if (v) {
        setMasa(v.currentTime);
        segerakPolygon(v.currentTime);
      }
      id = requestAnimationFrame(gelung);
    };
    id = requestAnimationFrame(gelung);
    return () => cancelAnimationFrame(id);
  }, [sedangMain, segerakPolygon]);

  // ---------- Auto-jejak ----------
  async function autoJejak() {
    const v = videoRef.current;
    if (!v || !meta || points.length < 3) return;

    batalRef.current = false;
    v.pause();
    setSedangMain(false);
    setStatus({ berjalan: true, progres: 0, mesej: "Menyediakan bingkai pertama..." });

    const mula = v.currentTime;
    const langkah = 1 / kadar;

    await pergiKe(mula);
    const awal = bacaBingkai();
    if (!awal) {
      setStatus({ berjalan: false, progres: 0, mesej: "Tak dapat baca bingkai video." });
      return;
    }

    const keSkalaPx = (t: Titik[]): TitikPx[] =>
      t.map(([x, y]) => ({ x: x * awal.lebar, y: y * awal.tinggi }));
    const keNormal = (t: TitikPx[]): Titik[] =>
      t.map((p) => [p.x / awal.lebar, p.y / awal.tinggi] as Titik);

    let polygonPx = keSkalaPx(points);
    let ciri = kesanCiri(awal.gray, polygonPx, 150);
    if (ciri.length < 8) {
      setStatus({
        berjalan: false,
        progres: 0,
        mesej:
          "Terlalu sedikit ciri boleh dijejak dalam polygon ini (tanah terlalu seragam atau kabur). Cuba mula pada saat yang lebih jelas, atau letak keyframe secara manual.",
      });
      return;
    }

    let piramidLepas: Piramid = awal.piramid;
    const dikumpul: KeyframePolygon[] = [{ t: mula, points: bundarkanTitik(points) }];
    let t = mula;
    let mesejAkhir = "";

    while (t + langkah <= durasi - 0.01) {
      if (batalRef.current) {
        mesejAkhir = "Jejak dihentikan.";
        break;
      }
      t += langkah;
      // eslint-disable-next-line no-await-in-loop
      await pergiKe(t);
      const bingkai = bacaBingkai();
      if (!bingkai) break;

      const hasil = jejakTitikDuaHala(piramidLepas, bingkai.piramid, ciri);
      const dari: TitikPx[] = [];
      const ke: TitikPx[] = [];
      hasil.forEach((h, i) => {
        if (h.ok) {
          dari.push(ciri[i]);
          ke.push(h.titik);
        }
      });

      // Berhenti bila terlalu sedikit ciri yang lulus semakan dua hala. Pada
      // rakaman yang baik 80%+ terselamat; bila ia jatuh serendah ini, yang
      // tinggal selalunya titik yang salah secara KONSISTEN (semuanya melekat
      // pada objek bergerak yang sama), jadi penapis outlier pun tak dapat
      // mengesannya dan kita akan hasilkan polygon yang nampak yakin tapi
      // tersasar. Lebih baik berhenti dan beritahu admin.
      const kadarHidup = dari.length / Math.max(1, ciri.length);
      const transform = kadarHidup < 0.35 ? null : anggarTransform(dari, ke);
      if (!transform || transform.bilanganInlier < 8) {
        mesejAkhir =
          `Jejak tak boleh dipercayai pada ${formatMasa(t)} ` +
          `(${dari.length}/${ciri.length} titik kekal). ` +
          (kadarHidup < 0.35
            ? "Biasanya sebab kamera bergerak terlalu laju, ada objek besar melintas, atau bingkai kabur. Cuba naikkan kadar sampel, atau betulkan polygon di sini dan jejak semula."
            : "Betulkan polygon di situ dan jejak semula.");
        t -= langkah;
        break;
      }

      polygonPx = polygonPx.map((p) => gunaAffin(transform.matriks, p));
      dikumpul.push({ t, points: bundarkanTitik(keNormal(polygonPx)) });

      // Bawa ke hadapan ciri yang masih hidup DAN masih dalam polygon; kalau
      // terlalu ramai tercicir (tanah berputar, objek melintas) kesan semula
      // dari bingkai terbaru supaya jejak tak reput perlahan-lahan.
      ciri = ke.filter((p) => titikDalamPolygon(p, polygonPx));
      if (ciri.length < CIRI_MINIMUM) {
        ciri = kesanCiri(bingkai.gray, polygonPx, 150);
        if (ciri.length < 8) {
          mesejAkhir = `Tiada ciri yang cukup jelas selepas ${formatMasa(t)}. Jejak berhenti di sini.`;
          break;
        }
      }

      piramidLepas = bingkai.piramid;
      setStatus({
        berjalan: true,
        progres: durasi > 0 ? (t - mula) / (durasi - mula) : 0,
        mesej: `Menjejak... ${formatMasa(t)} / ${formatMasa(durasi)}`,
      });

      if (dikumpul.length >= MAX_KEYFRAME_TRACK) {
        mesejAkhir = "Had keyframe dicapai — jejak berhenti.";
        break;
      }
    }

    // Keyframe sebelum titik mula dikekalkan; semua yang selepasnya diganti
    // dengan hasil jejak baharu ini.
    const dimampat = mampatKeyframes(dikumpul);
    setKeyframes((lama) => {
      const kekal = lama.filter((kf) => kf.t < mula - 0.02);
      return [...kekal, ...dimampat].sort((a, b) => a.t - b.t);
    });

    await lompatKe(t);
    setStatus({
      berjalan: false,
      progres: 1,
      mesej: mesejAkhir || `Siap — ${dimampat.length} keyframe sehingga ${formatMasa(t)}.`,
    });
  }

  function hentikanJejak() {
    batalRef.current = true;
  }

  function padamSemua() {
    setKeyframes([]);
    setPoints([]);
    setStatus(kosong);
  }

  const nisbah = meta ? `${meta.lebar} / ${meta.tinggi}` : "16 / 9";
  const adaKeyframe = keyframes.length > 0;
  const julat = adaKeyframe
    ? `${formatMasa(keyframes[0].t)} – ${formatMasa(keyframes[keyframes.length - 1].t)}`
    : "—";

  return (
    <div>
      <div className="mb-3 rounded-sm border border-brand-dark/10 bg-brand-cream/40 p-3 text-xs text-brand-dark/60">
        Fail video <strong>tidak dimuat naik</strong> — ia dibuka terus dari komputer anda untuk kerja
        jejak sahaja. Selepas simpan, muat naik fail <strong>yang sama</strong> ke YouTube (Unlisted)
        dan tampal pautannya di bahagian Media. Kalau potongan YouTube tak sama, laraskan offset masa
        di bawah.
        <br />
        Had fail: <strong>{formatSaizFail(MAX_SAIZ_VIDEO_BYTES)}</strong> · MP4 H.264 paling boleh diharap.
      </div>

      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={(e) => pilihFail(e.target.files?.[0] ?? null)}
        className="mb-3 w-full rounded-sm border border-brand-dark/20 p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark"
      />

      {!failUrl && adaKeyframe && (
        <p className="mb-3 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Track tersimpan ada {keyframes.length} keyframe ({julat})
          {namaFail ? ` dari fail "${namaFail}"` : ""}. Buka semula fail itu kalau mahu menyunting;
          tanpanya anda masih boleh laraskan offset dan label di bawah.
        </p>
      )}

      {failUrl && (
        <>
          <PolygonCanvas points={points} onChange={handleSuntingan} aspect={nisbah} disabled={status.berjalan}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src={failUrl}
              onLoadedMetadata={handleMetadata}
              onError={() =>
                // Fail .mov/HEVC dari iPhone dan sesetengah drone tak boleh
                // dinyahkod oleh Chrome walaupun saiznya kecil. Tanpa mesej ini
                // admin cuma nampak kotak hitam dan tak tahu apa yang salah.
                setStatus({
                  berjalan: false,
                  progres: 0,
                  mesej:
                    "Pelayar tak dapat memainkan fail ini. Biasanya ia HEVC/H.265 (fail .mov dari iPhone atau sesetengah drone). " +
                    "Tukar ke MP4 H.264 dahulu, kemudian pilih semula.",
                })
              }
              onPlay={() => setSedangMain(true)}
              onPause={() => setSedangMain(false)}
              onSeeked={(e) => {
                // Auto-jejak dan main balik mengemas kini masa sendiri; ini
                // untuk lompatan yang datang dari tempat lain, terutamanya
                // kedudukan awal yang ditetapkan semasa metadata dimuatkan.
                if (status.berjalan || sedangMain) return;
                const t = e.currentTarget.currentTime;
                setMasa(t);
                segerakPolygon(t);
              }}
              playsInline
              muted
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
          </PolygonCanvas>

          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={durasi || 0}
              step={0.05}
              value={masa}
              disabled={status.berjalan}
              onChange={(e) => lompatKe(Number(e.target.value))}
              className="w-full accent-[#C68A2E]"
            />
            <div className="relative -mt-1 h-3">
              {durasi > 0 &&
                keyframes.map((kf) => (
                  <button
                    key={kf.t}
                    type="button"
                    title={`Keyframe ${formatMasa(kf.t)}`}
                    onClick={() => lompatKe(kf.t)}
                    className="absolute top-0 h-2.5 w-0.5 -translate-x-1/2 bg-[#C68A2E]"
                    style={{ left: `${(kf.t / durasi) * 100}%` }}
                  />
                ))}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="tabular-nums text-brand-dark/60">
                {formatMasa(masa)} / {formatMasa(durasi)}
              </span>
              <button
                type="button"
                disabled={status.berjalan}
                onClick={() => lompatKe(masa - 1 / kadar)}
                className="rounded-sm border border-brand-dark/20 px-2 py-1 font-semibold text-brand-dark/70 disabled:opacity-40"
              >
                ‹ BINGKAI
              </button>
              <button
                type="button"
                disabled={status.berjalan}
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) v.play();
                  else v.pause();
                }}
                className="rounded-sm border border-brand-dark/20 px-2 py-1 font-semibold text-brand-dark/70 disabled:opacity-40"
              >
                {sedangMain ? "JEDA" : "MAIN"}
              </button>
              <button
                type="button"
                disabled={status.berjalan}
                onClick={() => lompatKe(masa + 1 / kadar)}
                className="rounded-sm border border-brand-dark/20 px-2 py-1 font-semibold text-brand-dark/70 disabled:opacity-40"
              >
                BINGKAI ›
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {status.berjalan ? (
              <button
                type="button"
                onClick={hentikanJejak}
                className="rounded-sm bg-red-600 px-3 py-2 text-xs font-semibold text-white"
              >
                HENTIKAN JEJAK
              </button>
            ) : (
              <button
                type="button"
                onClick={autoJejak}
                disabled={points.length < 3}
                className="rounded-sm bg-brand-dark px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                JEJAK DARI SINI →
              </button>
            )}

            <label className="flex items-center gap-1.5 text-xs text-brand-dark/60">
              Kadar sampel
              <select
                value={kadar}
                disabled={status.berjalan}
                onChange={(e) => setKadar(Number(e.target.value))}
                className="rounded-sm border border-brand-dark/20 bg-white p-1"
              >
                {PILIHAN_KADAR.map((k) => (
                  <option key={k} value={k}>
                    {k}/saat
                  </option>
                ))}
              </select>
            </label>

            {adaKeyframe && (
              <button
                type="button"
                disabled={status.berjalan}
                onClick={padamSemua}
                className="rounded-sm border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-40"
              >
                PADAM SEMUA KEYFRAME
              </button>
            )}
          </div>

          {status.berjalan && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-dark/10">
              <div
                className="h-full bg-[#C68A2E] transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, status.progres * 100))}%` }}
              />
            </div>
          )}
          {status.mesej && <p className="mt-2 text-xs text-brand-dark/60">{status.mesej}</p>}
        </>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-dark/70">
            Label atas polygon (pilihan)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="cth. Lot 4821"
            className="w-full rounded-sm border border-brand-dark/20 bg-white p-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-dark/70">
            Offset masa YouTube (saat)
          </label>
          <input
            type="number"
            step="0.1"
            value={offsetMasa}
            onChange={(e) => setOffsetMasa(Number(e.target.value) || 0)}
            className="w-full rounded-sm border border-brand-dark/20 bg-white p-2 text-sm"
          />
          <p className="mt-1 text-xs text-brand-dark/40">
            Positif kalau versi YouTube ada pembukaan tambahan di depan.
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-brand-dark/45">
        {adaKeyframe ? `${keyframes.length} keyframe · julat ${julat}` : "Belum ada keyframe."}
      </p>
    </div>
  );
}
