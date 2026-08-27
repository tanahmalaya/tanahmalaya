"use client";

import { useState } from "react";
import Image from "next/image";

export default function ActivityImages({ gambarList, tajuk }: { gambarList: string[]; tajuk: string }) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  if (gambarList.length === 0) {
    return <div className="h-32 bg-brand-cream" />;
  }

  // 1 gambar = satu petak penuh. 2/3/4 gambar = grid 2 lajur, SEMUA petak SAMA SAIZ.
  const gridCols = gambarList.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <>
      <div className={`grid ${gridCols} gap-1 p-1 bg-brand-cream`}>
        {gambarList.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-sm overflow-hidden cursor-pointer bg-white/50"
            onClick={() => setZoomIndex(i)}
          >
            <Image src={url} alt={`${tajuk} - gambar ${i + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>

      {zoomIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setZoomIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setZoomIndex(null)}
            aria-label="Tutup"
          >
            &times;
          </button>
          <div className="relative w-full max-w-3xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <Image
              src={gambarList[zoomIndex]}
              alt={`${tajuk} - gambar besar`}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}