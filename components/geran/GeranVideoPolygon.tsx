"use client";

// Video drone di halaman butiran, dengan sempadan tanah dilukis di atasnya.
//
// Videonya tetap di YouTube (kos bandwidth sifar) - kita cuma lukis semula
// polygon atas embed itu mengikut kedudukan main. Untuk tahu kedudukan itu kita
// perlukan YouTube IFrame Player API; `timeupdate` tak wujud untuk iframe silang
// domain dan piksel di dalamnya memang tak boleh dibaca.
//
// Kalau API itu gagal dimuat (penyekat iklan, rangkaian), komponen ini jatuh
// balik kepada iframe biasa tanpa overlay - video tetap boleh ditonton.

import { useEffect, useRef, useState } from "react";
import type { Titik, VideoPolygonTrack } from "@/lib/geran-polygon";
import { polygonPadaMasa } from "@/lib/geran-polygon";
import PolygonOverlay from "@/components/geran/PolygonOverlay";

// Keadaan pemain YouTube yang bermakna "video dah mula" - sebelum itu embed
// masih papar thumbnail, dan melukis polygon atasnya hanya mengelirukan.
const KEADAAN_AKTIF = new Set([1, 2, 3]); // playing, paused, buffering

let janjiApi: Promise<any> | null = null;

function muatApiYouTube(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (janjiApi) return janjiApi;

  janjiApi = new Promise((resolve, reject) => {
    const skrip = document.createElement("script");
    skrip.src = "https://www.youtube.com/iframe_api";
    skrip.async = true;
    skrip.onerror = () => reject(new Error("gagal muat"));
    // API memanggil satu callback global sahaja, jadi jangan tindih milik orang
    // lain kalau ada skrip lain di halaman yang sama.
    const sebelum = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof sebelum === "function") sebelum();
      resolve(w.YT);
    };
    document.head.appendChild(skrip);
    window.setTimeout(() => reject(new Error("tamat masa")), 10000);
  });
  return janjiApi;
}

export default function GeranVideoPolygon({
  videoId,
  tajuk,
  track,
}: {
  videoId: string;
  tajuk: string;
  track: VideoPolygonTrack | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bingkaiRef = useRef<HTMLDivElement>(null);
  const pemainRef = useRef<any>(null);
  const [points, setPoints] = useState<Titik[]>([]);
  const [aktif, setAktif] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [penuh, setPenuh] = useState(false);
  const [bolehPenuh, setBolehPenuh] = useState(false);

  // iPhone tak membenarkan elemen biasa masuk skrin penuh (hanya <video>), jadi
  // di situ kita biarkan butang skrin penuh YouTube sendiri hidup dan terima
  // bahawa polygon tak kelihatan dalam mod itu - lebih baik daripada butang
  // kita yang langsung tak berfungsi.
  useEffect(() => {
    setBolehPenuh(typeof document !== "undefined" && !!document.fullscreenEnabled);
  }, []);

  useEffect(() => {
    const kemas = () => setPenuh(document.fullscreenElement === bingkaiRef.current);
    document.addEventListener("fullscreenchange", kemas);
    return () => document.removeEventListener("fullscreenchange", kemas);
  }, []);

  async function tukarPenuh() {
    const el = bingkaiRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Pelayar boleh menolak (dasar keizinan, iframe tanpa allow="fullscreen").
      // Tiada apa yang berguna boleh dibuat selain kekal dalam mod biasa.
    }
  }

  const perluApi = !!track && track.keyframes.length > 0;

  useEffect(() => {
    if (!perluApi) return undefined;
    let dibuang = false;

    muatApiYouTube()
      .then((YT) => {
        const bekas = hostRef.current;
        if (dibuang || !bekas) return;

        // YT.Player MENGGANTIKAN elemen yang diberi dengan <iframe>nya sendiri.
        // Kalau kita serahkan nod yang React render, React akan memegang rujukan
        // ke nod yang sudah tiada dan gagal semasa nyahlekap
        // ("node to be removed is not a child"). Jadi kita cipta sasaran itu
        // sendiri di dalam bekas yang React uruskan, dan bersihkannya sendiri.
        bekas.innerHTML = "";
        const sasaran = document.createElement("div");
        bekas.appendChild(sasaran);

        pemainRef.current = new YT.Player(sasaran, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          // Tanpa ini iframe lahir dengan width="640" height="390" yang tetap.
          // Kelas Tailwind pada nod sasaran tak menyelamatkan keadaan kerana
          // YT MEMBUANG nod itu dan memasang iframenya sendiri di tempatnya.
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            // Matikan butang skrin penuh YouTube bila kita ada butang sendiri.
            // Skrin penuh YouTube menaikkan IFRAME sahaja ke skrin penuh, jadi
            // overlay kita tertinggal di belakangnya dan sempadan tanah terus
            // hilang - tepat pada saat pembeli paling mahu melihatnya.
            fs: document.fullscreenEnabled ? 0 : 1,
          },
          events: {
            onReady: () => {
              const iframe = pemainRef.current?.getIframe?.();
              if (!iframe) return;
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.display = "block";
              iframe.setAttribute("title", `Drone video - ${tajuk}`);
            },
            onStateChange: (e: { data: number }) => setAktif(KEADAAN_AKTIF.has(e.data)),
            onError: () => setGagal(true),
          },
        });
      })
      .catch(() => setGagal(true));

    return () => {
      dibuang = true;
      try {
        pemainRef.current?.destroy?.();
      } catch {
        // Pemain kadang-kadang dah dibuang bersama DOM - tiada apa nak dibersihkan.
      }
      pemainRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [perluApi, videoId, tajuk]);

  useEffect(() => {
    if (!aktif || !track) return undefined;
    let id = 0;
    const gelung = () => {
      const masa = pemainRef.current?.getCurrentTime?.();
      if (typeof masa === "number") setPoints(polygonPadaMasa(track, masa) ?? []);
      id = requestAnimationFrame(gelung);
    };
    id = requestAnimationFrame(gelung);
    return () => cancelAnimationFrame(id);
  }, [aktif, track]);

  return (
    <div
      ref={bingkaiRef}
      className={
        penuh
          ? "relative w-full h-full bg-black"
          : "aspect-video rounded-2xl overflow-hidden border border-black/[0.06] bg-black relative"
      }
    >
      {perluApi && !gagal ? (
        <>
          {/* Kotak ini mengisi apa sahaja saiz bekasnya, termasuk skrin penuh
              pada nisbah pelik. Tiada kotak nisbah dalaman diperlukan: pemain
              YouTube melapik video di tengah iframenya, dan overlay dengan
              padanan "contain" melakukan pengiraan yang sama di dalam kotak
              yang sama - jadi kedua-duanya dilapik serentak dan sentiasa
              bertindih, walau apa pun nisbah skrin. */}
          <div className="relative w-full h-full">
            <div ref={hostRef} className="w-full h-full" />
            {aktif && (
              // Embed YouTube melapik video yang bukan 16:9 di dalam iframe,
              // jadi overlay kena guna padanan "contain" supaya ia dilapik sama.
              <PolygonOverlay
                points={points}
                lebarMedia={track?.lebar}
                tinggiMedia={track?.tinggi}
                padanan="contain"
                label={track?.label}
              />
            )}
          </div>

          {bolehPenuh && (
            <button
              type="button"
              onClick={tukarPenuh}
              aria-label={penuh ? "Keluar skrin penuh" : "Skrin penuh"}
              title={penuh ? "Keluar skrin penuh" : "Skrin penuh"}
              className="absolute top-2 right-2 z-10 rounded-lg bg-black/55 p-2 text-white backdrop-blur-[2px] transition-colors hover:bg-black/75"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {penuh ? (
                  <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                ) : (
                  <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                )}
              </svg>
            </button>
          )}
        </>
      ) : (
        <iframe
          src={"https://www.youtube-nocookie.com/embed/" + videoId}
          title={"Drone video - " + tajuk}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
    </div>
  );
}
