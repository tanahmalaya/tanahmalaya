"use client";

// Paparan 360° untuk pembeli di halaman butiran penyenaraian: pilih
// panorama, pusing keliling, ketik hotspot untuk kad maklumat (lot, keluasan,
// harga, status), dan ikut anak panah "Explore" ke panorama lain.

import { useState } from "react";
import dynamic from "next/dynamic";
// CSS viewer dimuat di sini (statik), bukan hanya dalam chunk dinamik
// Viewer360 - PSV memeriksa gayanya semasa dibina dan akan mengadu kalau
// fail CSS belum sampai.
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { X } from "lucide-react";
import { JENIS_HOTSPOT, tajukHotspot, type Hotspot } from "@/lib/geran/panorama";

const Viewer360 = dynamic(() => import("./Viewer360"), {
  ssr: false,
  loading: () => <div className="aspect-[16/9] bg-[#1F2A24] animate-pulse" />,
});

export type SceneAwam = { id: string; url: string; tajuk: string | null; yawAwal: number; hotspots: Hotspot[] };
export type LotAwam360 = { noLot: string; status: "AVAILABLE" | "RESERVED" | "SOLD"; keluasan: string | null; harga: string | null };

const WARNA_STATUS = { AVAILABLE: "#10B981", RESERVED: "#F59E0B", SOLD: "#EF4444" } as const;
const LABEL_STATUS = { AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold" } as const;

export default function Paparan360({
  scenes,
  lots,
  sceneAktif,
  onTukarScene,
  kelas = "aspect-[4/3] sm:aspect-[16/9]",
}: {
  scenes: SceneAwam[];
  lots: Record<string, LotAwam360>;
  // Pilihan - bila diberi, scene dikawal dari luar (cth. klik lot di peta
  // membuka 360° dari kamera atas lot itu).
  sceneAktif?: string;
  onTukarScene?: (id: string) => void;
  kelas?: string;
}) {
  const [aktifDalam, setAktifDalam] = useState(scenes[0]?.id);
  const aktif = sceneAktif ?? aktifDalam;
  const setAktif = (id: string) => (onTukarScene ? onTukarScene(id) : setAktifDalam(id));
  const [kad, setKad] = useState<Hotspot | null>(null);
  const scene = scenes.find((s) => s.id === aktif) ?? scenes[0];
  if (!scene) return null;

  function klikHotspot(id: string) {
    const h = scene.hotspots.find((x) => x.id === id);
    if (!h) return;
    if (h.jenis === "EXPLORE") {
      const ke = h.keScene;
      if (ke && scenes.some((s) => s.id === ke)) {
        setAktif(ke);
        setKad(null);
      }
      return;
    }
    setKad(h);
  }

  const lot = kad?.lotId ? lots[kad.lotId] : undefined;

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden">
        <Viewer360
          url={scene.url}
          kunciScene={scene.id}
          yawAwal={scene.yawAwal}
          hotspots={scene.hotspots}
          onKlikHotspot={klikHotspot}
          onKlikPanorama={() => setKad(null)}
          kelas={kelas}
        />
        {kad && (
          <div className="absolute left-3 bottom-14 z-20 w-64 rounded-2xl bg-white p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setKad(null)}
              aria-label="Close"
              className="absolute top-2 right-2 p-1 rounded-full text-black/40 hover:bg-black/5"
            >
              <X size={16} />
            </button>
            <p className="text-sm font-bold text-[#0E3B2E] pr-6">
              {JENIS_HOTSPOT[kad.jenis].emoji} {tajukHotspot(kad)}
            </p>
            {lot ? (
              <div className="mt-2 space-y-1 text-sm text-[#0E3B2E]/75">
                <p className="flex items-center justify-between gap-2">
                  <strong className="text-[#0E3B2E]">{lot.noLot}</strong>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ background: WARNA_STATUS[lot.status] }}
                  >
                    {LABEL_STATUS[lot.status]}
                  </span>
                </p>
                {lot.keluasan && <p>{lot.keluasan}</p>}
                {lot.harga && <p className="font-extrabold text-[#0E3B2E]">{lot.harga}</p>}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[#0E3B2E]/50">{JENIS_HOTSPOT[kad.jenis].label}</p>
            )}
          </div>
        )}
      </div>
      {scenes.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setAktif(s.id);
                setKad(null);
              }}
              className={`relative shrink-0 w-28 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                s.id === scene.id ? "border-[#0E3B2E]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white truncate">
                {s.tajuk || `360° view ${i + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
