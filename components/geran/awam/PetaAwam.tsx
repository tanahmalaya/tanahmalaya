"use client";

// Peta lot untuk pembeli (halaman butiran listing): lot dilukis atas satelit
// ikut warna status, jalan/sungai, dan kamera 360°. Klik lot -> kad lot, dengan
// butang "360° from here" bila ada kamera berdiri atas lot itu.
//
// Muat dengan next/dynamic { ssr: false } - Leaflet menyentuh `window`.

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { JUBIN, type AsasPeta } from "@/lib/geran/peta";

export type LotPetaAwam = {
  id: string;
  noLot: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  keluasan: string | null;
  harga: string | null;
};
export type BentukAwam = {
  id: string;
  lapisan: "lot" | "jalan" | "sungai" | "label";
  bentuk: "titik" | "garis" | "poligon";
  points: [number, number][]; // [lng, lat]
  lotId: string | null;
  label: string | null;
};
export type KameraAwam = { sceneId: string; lat: number; lng: number; lotId: string | null; tajuk: string | null };

const WARNA = { AVAILABLE: "#10B981", RESERVED: "#F59E0B", SOLD: "#EF4444" } as const;
const LABEL = { AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold" } as const;
const ll = (p: [number, number]) => [p[1], p[0]] as [number, number];

// Muat pandangan hanya bila `kunci` (lot dipilih) berubah - titik dicipta
// semula setiap render, jadi bergantung padanya akan melompatkan peta setiap
// kali pembeli berinteraksi.
function Muat({ titik, fokus, kunci }: { titik: [number, number][]; fokus: [number, number][] | null; kunci: string }) {
  const map = useMap();
  useEffect(() => {
    const sasaran = fokus && fokus.length > 0 ? fokus : titik;
    if (sasaran.length === 1) map.setView(ll(sasaran[0]), 17);
    else if (sasaran.length > 1) map.fitBounds(sasaran.map(ll), { padding: [30, 30], maxZoom: 18 });
  }, [kunci]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function PetaAwam({
  bentuk,
  lots,
  kamera,
  pusat,
  lotDipilih,
  onPilihLot,
  onBuka360,
}: {
  bentuk: BentukAwam[];
  lots: Record<string, LotPetaAwam>;
  kamera: KameraAwam[];
  pusat: [number, number] | null; // [lat, lng] listing
  lotDipilih: string | null;
  onPilihLot: (lotId: string | null) => void;
  onBuka360: (sceneId: string) => void;
}) {
  const [asas, setAsas] = useState<AsasPeta>("satelit");
  const semua: [number, number][] = [
    ...bentuk.flatMap((b) => b.points),
    ...kamera.map((k) => [k.lng, k.lat] as [number, number]),
    ...(pusat ? [[pusat[1], pusat[0]] as [number, number]] : []),
  ];
  const fokus = lotDipilih ? bentuk.filter((b) => b.lotId === lotDipilih).flatMap((b) => b.points) : null;
  const tengah: [number, number] = pusat ?? (semua.length ? ll(semua[0]) : [4.2105, 101.9758]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={tengah} zoom={16} scrollWheelZoom={false} className="h-full w-full" style={{ background: "#1F2A24" }}>
        <TileLayer key={asas} url={JUBIN[asas].leaflet} attribution={JUBIN[asas].atribusi} maxZoom={20} maxNativeZoom={19} />
        <Muat titik={semua} fokus={fokus} kunci={lotDipilih ?? "semua"} />

        {bentuk.map((b) => {
          if (b.bentuk === "poligon") {
            const lot = b.lotId ? lots[b.lotId] : undefined;
            const warna = lot ? WARNA[lot.status] : "#F4C55C";
            const dipilih = !!lot && lot.id === lotDipilih;
            const kam = lot ? kamera.find((k) => k.lotId === lot.id) : undefined;
            return (
              <Polygon
                key={b.id}
                positions={b.points.map(ll)}
                pathOptions={{ color: dipilih ? "#FFFFFF" : warna, weight: dipilih ? 4 : 2.5, fillColor: warna, fillOpacity: dipilih ? 0.45 : 0.3 }}
                eventHandlers={{ click: () => onPilihLot(lot?.id ?? null) }}
              >
                {lot && (
                  <Tooltip direction="center" permanent className="!bg-transparent !border-0 !shadow-none !text-white !font-bold before:!hidden">
                    <span style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>{lot.noLot}</span>
                  </Tooltip>
                )}
                {lot && (
                  <Popup>
                    <div className="min-w-[190px] text-[13px] leading-snug">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-[15px]">{lot.noLot}</strong>
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: WARNA[lot.status] }}>
                          {LABEL[lot.status]}
                        </span>
                      </div>
                      {lot.keluasan && <p className="mt-1 text-black/60">{lot.keluasan}</p>}
                      {lot.harga && <p className="font-extrabold text-[#0E3B2E]">{lot.harga}</p>}
                      {kam && (
                        <button
                          type="button"
                          onClick={() => onBuka360(kam.sceneId)}
                          className="mt-2 w-full rounded-full bg-[#0E3B2E] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          360° view from this lot
                        </button>
                      )}
                    </div>
                  </Popup>
                )}
              </Polygon>
            );
          }
          if (b.bentuk === "garis") {
            return (
              <Polyline key={b.id} positions={b.points.map(ll)} pathOptions={{ color: b.lapisan === "sungai" ? "#38BDF8" : "#FBBF24", weight: 4 }}>
                {b.label && <Tooltip sticky>{b.label}</Tooltip>}
              </Polyline>
            );
          }
          return null;
        })}

        {kamera.map((k) => (
          <CircleMarker
            key={k.sceneId}
            center={[k.lat, k.lng]}
            radius={7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#8B5CF6", fillOpacity: 1 }}
            eventHandlers={{ click: () => onBuka360(k.sceneId) }}
          >
            <Tooltip>📷 {k.tajuk || "360° view"} — click to open</Tooltip>
          </CircleMarker>
        ))}

        {bentuk.length === 0 && pusat && (
          <CircleMarker center={pusat} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#0E3B2E", fillOpacity: 1 }} />
        )}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[500] flex rounded-full bg-white/95 p-0.5 text-xs font-semibold shadow">
        {(["satelit", "peta"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAsas(a)}
            className={`rounded-full px-3 py-1 ${asas === a ? "bg-[#0E3B2E] text-white" : "text-[#0E3B2E]/60"}`}
          >
            {a === "satelit" ? "Satellite" : "Map"}
          </button>
        ))}
      </div>
    </div>
  );
}
