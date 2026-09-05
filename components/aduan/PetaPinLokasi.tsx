"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type GeocodeResult = { label: string; lat: number; lng: number };
type Pin = { lat: number; lng: number };

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function KlikUntukPin({ onPick }: { onPick: (p: Pin) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ pin }: { pin: Pin | null }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (pin) {
      map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 15), { duration: first.current ? 0 : 1 });
      first.current = false;
    }
  }, [pin, map]);
  return null;
}

export default function PetaPinLokasi({
  value,
  onChange,
}: {
  value: Pin | null;
  onChange: (p: Pin | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { cache: "no-store" });
        const json = await res.json();
        setSearchResults(json.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pilihLokasi = (r: GeocodeResult) => {
    onChange({ lat: r.lat, lng: r.lng });
    setQuery(r.label);
    setSearchResults([]);
  };

  const gunaGps = () => {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError("Peranti/pelayar anda tidak menyokong GPS.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setQuery("");
        setSearchResults([]);
      },
      () => {
        setGpsLoading(false);
        setGpsError("Gagal mendapatkan lokasi. Pastikan kebenaran GPS dibenarkan pada pelayar.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari alamat atau kawasan..."
            className="w-full border border-brand-dark/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          {(searchLoading || searchResults.length > 0) && (
            <div className="absolute z-[1000] mt-1 w-full bg-white border border-black/10 rounded-md shadow-lg max-h-64 overflow-auto">
              {searchLoading && <p className="px-3 py-2 text-xs text-brand-dark/50">Mencari...</p>}
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pilihLokasi(r)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-brand-cream border-b border-black/5 last:border-0"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={gunaGps}
          disabled={gpsLoading}
          className="shrink-0 bg-brand-gold text-brand-dark px-4 py-2 rounded-sm text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
        >
          {gpsLoading ? "Mengesan..." : "📍 Guna Lokasi Saya"}
        </button>
      </div>
      {gpsError && <p className="mb-2 text-xs text-red-600">{gpsError}</p>}

      <p className="text-xs text-brand-dark/50 mb-2">
        Klik pada peta untuk letak/pindah pin di lokasi tanah yang diceroboh, atau seret pin sedia ada.
      </p>

      <div className="rounded-md overflow-hidden border border-black/10">
        <MapContainer
          center={value ? [value.lat, value.lng] : MALAYSIA_CENTER}
          zoom={value ? 15 : 6}
          scrollWheelZoom={true}
          style={{ height: "380px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <KlikUntukPin onPick={onChange} />
          <FlyTo pin={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const pos = m.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            >
              <Popup>Lokasi pencerobohan (seret untuk laraskan)</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <input
          type="number"
          step="any"
          placeholder="Latitud"
          value={value?.lat ?? ""}
          onChange={(e) => {
            const lat = parseFloat(e.target.value);
            if (!Number.isNaN(lat)) onChange({ lat, lng: value?.lng ?? MALAYSIA_CENTER[1] });
          }}
          className="border border-brand-dark/20 rounded-sm px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitud"
          value={value?.lng ?? ""}
          onChange={(e) => {
            const lng = parseFloat(e.target.value);
            if (!Number.isNaN(lng)) onChange({ lat: value?.lat ?? MALAYSIA_CENTER[0], lng });
          }}
          className="border border-brand-dark/20 rounded-sm px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
