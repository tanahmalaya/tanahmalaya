"use client";

// Pemapar panorama 360° (Photo Sphere Viewer) dengan hotspot - dikongsi editor
// LANDHUB dan halaman awam. Pustaka (three.js) besar, jadi ia hanya diimport
// secara dinamik bila komponen ini benar-benar dipasang.
//
// Hotspot dilukis sebagai penanda HTML; klik penanda -> onKlikHotspot, klik
// kawasan kosong -> onKlikPanorama(yaw, pitch) dalam darjah (untuk meletak
// hotspot baru dalam editor).

import { useEffect, useRef } from "react";
import type { Viewer } from "@photo-sphere-viewer/core";
import type { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { JENIS_HOTSPOT, tajukHotspot, type Hotspot } from "@/lib/geran/panorama";

const keRad = (d: number) => (d * Math.PI) / 180;
const keDarjah = (r: number) => (r * 180) / Math.PI;

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function htmlPenanda(h: Hotspot, dipilih: boolean): string {
  const jenis = JENIS_HOTSPOT[h.jenis];
  if (h.jenis === "EXPLORE") {
    // Anak panah "Explore" - bulatan lutsinar macam navigasi Street View.
    return `<div class="flex flex-col items-center gap-1 cursor-pointer select-none">
      <span class="w-12 h-12 rounded-full bg-black/45 border-2 ${dipilih ? "border-emerald-400" : "border-white"} text-white text-2xl flex items-center justify-center shadow-lg -rotate-90">➜</span>
      <span class="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white whitespace-nowrap">${escape(h.label?.trim() || "Explore")}</span>
    </div>`;
  }
  return `<div class="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 cursor-pointer select-none shadow-lg whitespace-nowrap ${
    dipilih ? "ring-2 ring-emerald-400" : ""
  }" style="background:rgba(0,0,0,.62)">
    <span class="w-7 h-7 rounded-full flex items-center justify-center text-[15px]" style="background:${jenis.warna}33;border:2px solid ${jenis.warna}">${jenis.emoji}</span>
    <span class="text-[12.5px] font-bold text-white">${escape(tajukHotspot(h))}</span>
  </div>`;
}

export type Api360 = { ambilYaw: () => number; pusing: (yaw: number) => void };

export default function Viewer360({
  url,
  kunciScene,
  yawAwal = 0,
  hotspots,
  dipilih = null,
  onKlikPanorama,
  onKlikHotspot,
  onSedia,
  kelas = "h-[520px]",
}: {
  url: string;
  // Identiti scene - dua scene boleh berkongsi fail gambar yang sama tapi
  // dengan arah awal & hotspot berbeza.
  kunciScene?: string;
  yawAwal?: number;
  hotspots: Hotspot[];
  dipilih?: string | null;
  onKlikPanorama?: (yaw: number, pitch: number) => void;
  onKlikHotspot?: (id: string) => void;
  onSedia?: (api: Api360) => void;
  kelas?: string;
}) {
  const bekasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersRef = useRef<MarkersPlugin | null>(null);
  // Panggilan balik terkini dalam ref - pendengar PSV didaftar sekali sahaja.
  const panggilRef = useRef({ onKlikPanorama, onKlikHotspot });
  panggilRef.current = { onKlikPanorama, onKlikHotspot };
  const hotspotRef = useRef({ hotspots, dipilih });
  hotspotRef.current = { hotspots, dipilih };

  function lukisPenanda() {
    const m = markersRef.current;
    if (!m) return;
    const { hotspots: hs, dipilih: pilih } = hotspotRef.current;
    m.setMarkers(
      hs.map((h) => ({
        id: h.id,
        position: { yaw: keRad(h.yaw), pitch: keRad(h.pitch) },
        html: htmlPenanda(h, h.id === pilih),
        anchor: "center center",
        zIndex: h.id === pilih ? 20 : 10,
      }))
    );
  }

  // Cipta viewer sekali; URL & hotspot dikemas kini tanpa membina semula.
  useEffect(() => {
    let batal = false;
    (async () => {
      const [{ Viewer: KelasViewer }, { MarkersPlugin: KelasMarkers }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/markers-plugin"),
      ]);
      if (batal || !bekasRef.current) return;
      const viewer = new KelasViewer({
        container: bekasRef.current,
        panorama: url,
        defaultYaw: keRad(yawAwal),
        defaultPitch: 0,
        navbar: ["zoom", "move", "fullscreen"],
        loadingTxt: "Loading 360°…",
        mousewheelCtrlKey: false,
        plugins: [[KelasMarkers, { markers: [] }]],
      });
      viewerRef.current = viewer;
      const markers = viewer.getPlugin(KelasMarkers) as MarkersPlugin;
      markersRef.current = markers;

      viewer.addEventListener("ready", () => lukisPenanda(), { once: true });
      markers.addEventListener("select-marker", ({ marker }) => panggilRef.current.onKlikHotspot?.(marker.id));
      viewer.addEventListener("click", ({ data }) => {
        if (data.rightclick) return;
        // Klik atas penanda juga sampai ke sini - biar select-marker yang urus.
        if ((data.target as HTMLElement | undefined)?.closest?.(".psv-marker")) return;
        panggilRef.current.onKlikPanorama?.(keDarjah(data.yaw), keDarjah(data.pitch));
      });

      onSedia?.({
        ambilYaw: () => keDarjah(viewer.getPosition().yaw),
        pusing: (yaw) => viewer.rotate({ yaw: keRad(yaw), pitch: 0 }),
      });
    })();
    return () => {
      batal = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      markersRef.current = null;
    };
    // Sengaja sekali sahaja: pertukaran URL diurus effect di bawah.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const urlDimuatRef = useRef(url);
  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    if (urlDimuatRef.current === url) {
      // Scene lain atas gambar yang sama - cuma pusing ke arah awalnya.
      v.rotate({ yaw: keRad(yawAwal), pitch: 0 });
      return;
    }
    urlDimuatRef.current = url;
    markersRef.current?.clearMarkers();
    v.setPanorama(url, { position: { yaw: keRad(yawAwal), pitch: 0 }, transition: { speed: 600, rotation: false } }).then(() => lukisPenanda());
    // yawAwal sengaja tiada - butang "Start view here" dalam editor tak patut
    // memusingkan pandangan admin; hanya pertukaran scene.
  }, [url, kunciScene]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    lukisPenanda();
  }, [hotspots, dipilih]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={bekasRef} className={`w-full bg-[#1F2A24] ${kelas}`} />;
}
