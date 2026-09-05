"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Peta baca-sahaja (satu pin, tak boleh diseret) untuk paparan admin lihat
// lokasi pencerobohan yang dihantar pengadu - lihat PetaPinLokasi.tsx untuk
// versi boleh-edit yang diguna dalam borang awam.
export default function PetaLihatLokasi({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="rounded-md overflow-hidden border border-black/10">
      <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={true} style={{ height: "320px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={markerIcon}>
          <Popup>Lokasi pencerobohan dilaporkan</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
