"use client";

// Bahagian utama halaman listing untuk pembeli: satu kawasan paparan dengan
// suis Photos / 2D Map / 360° View, dan senarai lot di bawahnya yang
// berinteraksi dengan peta ("Show on map") dan 360° ("360°").
//
// Butang lain dalam halaman (cth. "Explore Lots") hanya pautan #peta / #360 -
// komponen ini dengar hashchange dan bertukar paparan tanpa muat semula.

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Map as MapIcon, Orbit } from "lucide-react";
import GeranImageGallery from "@/components/geran/GeranImageGallery";
import Paparan360, { type LotAwam360, type SceneAwam } from "@/components/geran/panorama/Paparan360";
import type { PenandaAwam } from "@/lib/geran/penanda";
import type { BentukAwam, KameraAwam, LotPetaAwam } from "./PetaAwam";

const PetaAwam = dynamic(() => import("./PetaAwam"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#1F2A24] animate-pulse" />,
});

type Paparan = "gambar" | "peta" | "360";

const WARNA = { AVAILABLE: "#10B981", RESERVED: "#F59E0B", SOLD: "#EF4444" } as const;
const LABEL = { AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold" } as const;

export default function PaparanHartanah({
  tajuk,
  gambarUrls,
  penanda,
  bentukPeta,
  kamera,
  pusat,
  scenes,
  lots,
}: {
  tajuk: string;
  gambarUrls: string[];
  penanda: PenandaAwam;
  bentukPeta: BentukAwam[];
  kamera: KameraAwam[];
  pusat: [number, number] | null;
  scenes: SceneAwam[];
  lots: LotPetaAwam[];
}) {
  const adaPeta = bentukPeta.length > 0 || kamera.length > 0 || pusat !== null;
  const ada360 = scenes.length > 0;
  const [paparan, setPaparan] = useState<Paparan>(gambarUrls.length > 0 ? "gambar" : adaPeta ? "peta" : "gambar");
  const [scene, setScene] = useState<string | undefined>(scenes[0]?.id);
  const [lotDipilih, setLotDipilih] = useState<string | null>(null);
  const bekasRef = useRef<HTMLDivElement>(null);

  const tunjuk = useCallback(
    (p: Paparan) => {
      if (p === "peta" && !adaPeta) return;
      if (p === "360" && !ada360) return;
      setPaparan(p);
      bekasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [adaPeta, ada360]
  );

  // #peta / #360 dari pautan lain dalam halaman atau kad direktori.
  useEffect(() => {
    const ikutHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "peta" || h === "360" || h === "gambar") tunjuk(h);
    };
    ikutHash();
    window.addEventListener("hashchange", ikutHash);
    return () => window.removeEventListener("hashchange", ikutHash);
  }, [tunjuk]);

  const buka360 = (sceneId: string) => {
    setScene(sceneId);
    tunjuk("360");
  };

  const lotIkutId = Object.fromEntries(lots.map((l) => [l.id, l]));
  const lot360: Record<string, LotAwam360> = Object.fromEntries(
    lots.map((l) => [l.id, { noLot: l.noLot, status: l.status, keluasan: l.keluasan, harga: l.harga }])
  );
  const lotDilukis = new Set(bentukPeta.filter((b) => b.lotId).map((b) => b.lotId as string));

  const suis = (p: Paparan, label: string, Ikon: typeof MapIcon, boleh: boolean) =>
    boleh && (
      <button
        type="button"
        onClick={() => tunjuk(p)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
          paparan === p ? "bg-[#0E3B2E] text-white" : "text-[#0E3B2E]/60 hover:text-[#0E3B2E]"
        }`}
      >
        <Ikon size={15} /> {label}
      </button>
    );

  const bilSuis = [gambarUrls.length > 0 || !adaPeta, adaPeta, ada360].filter(Boolean).length;

  return (
    <div ref={bekasRef} className="scroll-mt-20">
      {bilSuis > 1 && (
        <div className="inline-flex rounded-full bg-white border border-black/[0.06] p-1 mb-3 shadow-sm">
          {suis("gambar", "Photos", Camera, true)}
          {suis("peta", "2D Map", MapIcon, adaPeta)}
          {suis("360", "360° View", Orbit, ada360)}
        </div>
      )}

      {paparan === "gambar" && <GeranImageGallery gambarUrls={gambarUrls} tajuk={tajuk} penanda={penanda} />}
      {paparan === "peta" && (
        <div className="aspect-[4/3] sm:aspect-[16/9] rounded-3xl overflow-hidden">
          <PetaAwam
            bentuk={bentukPeta}
            lots={lotIkutId}
            kamera={kamera}
            pusat={pusat}
            lotDipilih={lotDipilih}
            onPilihLot={setLotDipilih}
            onBuka360={buka360}
          />
        </div>
      )}
      {paparan === "360" && ada360 && (
        <Paparan360 scenes={scenes} lots={lot360} sceneAktif={scene} onTukarScene={setScene} />
      )}

      {lots.length > 0 && (
        <section className="mt-6 bg-white border border-black/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-[#0E3B2E]">Lots ({lots.length})</h2>
            <div className="flex gap-3 text-[11.5px] text-[#0E3B2E]/55">
              {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: WARNA[s] }} />
                  {lots.filter((l) => l.status === s).length} {LABEL[s]}
                </span>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-black/[0.05]">
            {lots.map((l) => {
              const kam = kamera.find((k) => k.lotId === l.id);
              return (
                <li
                  key={l.id}
                  className={`flex flex-wrap items-center gap-3 py-2.5 ${lotDipilih === l.id ? "bg-[#0E3B2E]/[0.03] -mx-2 px-2 rounded-lg" : ""}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: WARNA[l.status] }} />
                  <span className="flex-1 min-w-[120px]">
                    <span className="block text-sm font-bold text-[#0E3B2E]">{l.noLot}</span>
                    <span className="block text-xs text-[#0E3B2E]/50">
                      {LABEL[l.status]}
                      {l.keluasan ? ` · ${l.keluasan}` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold text-[#0E3B2E] tabular-nums">{l.harga ?? (l.status === "SOLD" ? "Sold" : "—")}</span>
                  <span className="flex gap-1.5">
                    {lotDilukis.has(l.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLotDipilih(l.id);
                          tunjuk("peta");
                        }}
                        className="rounded-full border border-[#0E3B2E]/20 px-2.5 py-1 text-xs font-bold text-[#0E3B2E] hover:bg-[#0E3B2E]/[0.05]"
                      >
                        Show on map
                      </button>
                    )}
                    {kam && (
                      <button
                        type="button"
                        onClick={() => buka360(kam.sceneId)}
                        className="rounded-full bg-[#0E3B2E] px-2.5 py-1 text-xs font-bold text-white"
                      >
                        360°
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
