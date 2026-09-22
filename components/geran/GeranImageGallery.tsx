"use client";

import { useState } from "react";
import Image from "next/image";
import PolygonOverlay from "@/components/geran/PolygonOverlay";
import type { GambarPolygons } from "@/lib/geran-polygon";

function LandPlaceholderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M5 20V10l7-6 7 6v10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function GeranImageGallery({
  gambarUrls,
  tajuk,
  polygons = {},
}: {
  gambarUrls: string[];
  tajuk: string;
  polygons?: GambarPolygons;
}) {
  const [active, setActive] = useState(0);
  const sempadan = polygons[gambarUrls[active]];

  if (gambarUrls.length === 0) {
    return (
      <div className="relative aspect-[16/9] rounded-3xl bg-gradient-to-br from-[#F6F4EE] to-black/[0.04] flex items-center justify-center text-[#0E3B2E]/20">
        <LandPlaceholderIcon />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#F6F4EE]">
        <Image src={gambarUrls[active]} alt={tajuk} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
        {/* Polygon dilukis dalam kotak yang sama dengan gambar dan guna
            padanan "cover", jadi ia dipangkas serentak dengan gambarnya. */}
        {sempadan && (
          <PolygonOverlay
            points={sempadan.points}
            lebarMedia={sempadan.w}
            tinggiMedia={sempadan.h}
            padanan="cover"
            label={sempadan.label}
          />
        )}
      </div>
      {gambarUrls.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {gambarUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                active === i ? "border-[#0E3B2E]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
