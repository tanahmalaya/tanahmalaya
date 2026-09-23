"use client";

// Peta satelit kecil untuk meletak kedudukan kamera 360° - klik peta untuk
// alihkan kamera. Lot yang dilukis atas satelit (Lot Marker) dipapar supaya
// admin boleh letak kamera tepat atas lot yang betul.
//
// Muat dengan next/dynamic { ssr: false } - Leaflet menyentuh `window`.

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { JUBIN } from "@/lib/geran/peta";
import type { Ciri } from "@/lib/geran/penanda";

export type KameraLain = { kunci: string; lat: number; lng: number; tajuk: string };

function Klik({ onPilih }: { onPilih: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPilih(e.latlng.lat, e.latlng.lng) });
  return null;
}

function IkutKamera({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null && !map.getBounds().contains([lat, lng])) map.panTo([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function PetaKamera({
  pusat,
  lat,
  lng,
  onPilih,
  bentuk,
  warnaLot,
  kameraLain,
}: {
  pusat: [number, number]; // [lat, lng]
  lat: number | null;
  lng: number | null;
  onPilih: (lat: number, lng: number) => void;
  bentuk: Ciri[];
  warnaLot: (lotId: string | null | undefined) => string;
  kameraLain: KameraLain[];
}) {
  return (
    <MapContainer
      center={lat !== null && lng !== null ? [lat, lng] : pusat}
      zoom={17}
      scrollWheelZoom
      className="h-56 w-full rounded-lg"
      style={{ background: "#1F2A24", cursor: "crosshair" }}
    >
      <TileLayer url={JUBIN.satelit.leaflet} attribution={JUBIN.satelit.atribusi} maxZoom={20} maxNativeZoom={19} />
      <Klik onPilih={onPilih} />
      <IkutKamera lat={lat} lng={lng} />
      {bentuk
        .filter((c) => c.bentuk === "poligon")
        .map((c) => (
          <Polygon
            key={c.id}
            positions={c.points.map((p) => [p[1], p[0]] as [number, number])}
            pathOptions={{ color: warnaLot(c.lotId), weight: 2, fillOpacity: 0.25 }}
            interactive={false}
          />
        ))}
      {kameraLain.map((k) => (
        <CircleMarker
          key={k.kunci}
          center={[k.lat, k.lng]}
          radius={6}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#64748B", fillOpacity: 1 }}
          interactive={false}
        >
          <Tooltip>{k.tajuk}</Tooltip>
        </CircleMarker>
      ))}
      {lat !== null && lng !== null && (
        <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#8B5CF6", fillOpacity: 1 }} interactive={false} />
      )}
    </MapContainer>
  );
}
