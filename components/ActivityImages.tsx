"use client";

import { useState } from "react";
import Image from "next/image";

export default function ActivityImages({ gambarList, tajuk }: { gambarList: string[]; tajuk: string }) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  return (
    <>
      <div className="relative h-32 bg-brand-cream cursor-pointer" onClick={() => gambarList[0] && setZoomIndex(0)}>
        {gambarList[0] && <Image src={gambarList[0]} alt={tajuk} fill className="object-contain" />}
      </div>

      {gambarList.length > 1 && (
        <div className="flex gap-1 p-1 bg-brand-cream">
          {gambarList.slice(1).map((url, i) => (
            <div
              key={i}
              className="relative flex-1 h-12 rounded-sm overflow-hidden bg-brand-cream cursor-pointer"
              onClick={() => setZoomIndex(i + 1)}
            >
              <Image src={url} alt={`${tajuk} - gambar ${i + 2}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

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
