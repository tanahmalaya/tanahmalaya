"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const loadingMap = (
  <div className="h-[420px] sm:h-[550px] rounded-2xl bg-white/60 animate-pulse flex items-center justify-center text-brand-dark/40 text-sm">
    Memuatkan peta...
  </div>
);

const PetaBanjir = dynamic(() => import("@/components/banjir/PetaBanjir"), {
  ssr: false,
  loading: () => loadingMap,
});

const PetaWakaf = dynamic(() => import("@/components/wakaf/PetaWakaf"), {
  ssr: false,
  loading: () => loadingMap,
});

type Tab = "banjir" | "wakaf";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "banjir", label: "Semak Banjir", icon: "🌊" },
  { id: "wakaf", label: "Tanah Wakaf", icon: "🕌" },
];

export default function PetaTabs() {
  const [tab, setTab] = useState<Tab>("banjir");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "wakaf" || t === "banjir") setTab(t);
  }, []);

  const pilihTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState({}, "", url.toString());
  };

  const aktifIndex = TABS.findIndex((t) => t.id === tab);

  return (
    <div>
      <div className="relative grid grid-cols-2 gap-1 mb-6 p-1 bg-black/[0.05] rounded-2xl max-w-md">
        <div
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${aktifIndex * 100}%)` }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pilihTab(t.id)}
            className={`relative z-10 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${
              tab === t.id ? "text-brand-dark" : "text-brand-dark/45 hover:text-brand-dark/70"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "banjir" && <PetaBanjir />}
      {tab === "wakaf" && <PetaWakaf />}
    </div>
  );
}
