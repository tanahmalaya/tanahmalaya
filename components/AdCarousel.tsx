"use client";

import { useEffect, useState } from "react";

type Ad = {
  id: string;
  namaAhli: string;
  gambarUrl: string;
  pautan: string;
};

export default function AdCarousel({ ads }: { ads: Ad[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="w-full bg-white border-t border-brand-cream py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <p className="text-xs text-brand-dark/50 uppercase tracking-wide">Iklan Komuniti</p>
        <a
          href={ad.pautan}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ad.gambarUrl} alt={ad.namaAhli} className="h-8 object-contain" />
          <span className="text-sm font-medium">{ad.namaAhli}</span>
        </a>
        <div className="flex gap-1">
          {ads.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-brand-gold" : "bg-brand-dark/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
