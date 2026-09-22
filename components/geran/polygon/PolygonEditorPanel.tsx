"use client";

// Bekas dua tab untuk editor sempadan tanah dalam skrin edit penyenaraian.
// Dipisahkan dari GeranAdminEditForm supaya borang itu kekal senang dibaca -
// panel ini yang tahu tentang tab, borang itu cuma pegang nilainya.

import { useState } from "react";
import type { GambarPolygons, VideoPolygonTrack } from "@/lib/geran-polygon";
import GambarPolygonEditor from "./GambarPolygonEditor";
import VideoPolygonEditor from "./VideoPolygonEditor";

type Tab = "gambar" | "video";

export default function PolygonEditorPanel({
  gambarUrls,
  gambarPolygons,
  onGambarChange,
  videoTrack,
  onVideoChange,
}: {
  gambarUrls: string[];
  gambarPolygons: GambarPolygons;
  onGambarChange: (polygons: GambarPolygons) => void;
  videoTrack: VideoPolygonTrack | null;
  onVideoChange: (track: VideoPolygonTrack | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("gambar");

  const bilGambar = Object.keys(gambarPolygons).filter((u) => gambarUrls.includes(u)).length;
  const bilKeyframe = videoTrack?.keyframes.length ?? 0;

  const butang = (nilai: Tab, teks: string, kiraan: number) => (
    <button
      type="button"
      onClick={() => setTab(nilai)}
      className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold ${
        tab === nilai
          ? "border-brand-dark text-brand-dark"
          : "border-transparent text-brand-dark/45 hover:text-brand-dark/70"
      }`}
    >
      {teks}
      {kiraan > 0 && (
        <span className="ml-1.5 rounded-full bg-[#C68A2E] px-1.5 py-0.5 text-[10px] text-white">
          {kiraan}
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex border-b border-brand-dark/10">
        {butang("gambar", "Gambar", bilGambar)}
        {butang("video", "Video drone", bilKeyframe)}
      </div>

      {/* Kedua-dua editor dikekalkan terpasang supaya video yang dipilih dan
          kerja jejak tak hilang bila admin menyelak ke tab gambar sekejap. */}
      <div className={tab === "gambar" ? "" : "hidden"}>
        <GambarPolygonEditor gambarUrls={gambarUrls} value={gambarPolygons} onChange={onGambarChange} />
      </div>
      <div className={tab === "video" ? "" : "hidden"}>
        <VideoPolygonEditor value={videoTrack} onChange={onVideoChange} />
      </div>
    </div>
  );
}
