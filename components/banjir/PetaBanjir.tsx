"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Circle,
  Marker,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FloodPoint = {
  id: number;
  name: string;
  latti: number;
  longi: number;
  negeri: string;
  daerah: string;
  mukim: string;
  bencana: string;
  mangsa: number;
  keluarga: number;
  kapasiti: number;
};

type PpsResponse = {
  points: FloodPoint[];
  fetchedAt: string;
  source: string;
  error?: string;
};

type StesenStatus = "normal" | "waspada" | "amaran" | "bahaya" | "tiada_data";

type StesenAir = {
  id: string;
  name: string;
  district: string;
  negeri: string;
  lat: number;
  lng: number;
  level: number | null;
  normal: number;
  alert: number;
  warning: number;
  danger: number;
  lastUpdate: string;
  status: StesenStatus;
};

type ParasAirResponse = {
  stations: StesenAir[];
  fetchedAt: string;
  source: string;
  error?: string;
};

type HotspotBanjir = {
  id: number;
  name: string;
  daerah: string;
  negeri: string;
  lat: number;
  lng: number;
};

type HotspotResponse = {
  hotspots: HotspotBanjir[];
  fetchedAt: string;
  source: string;
  error?: string;
};

type GeocodeResult = { label: string; lat: number; lng: number };
type Lokasi = { lat: number; lng: number; label: string };

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];
const REFRESH_MS = 120_000;

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const HOTSPOT_RADIUS_KM = 2;

function kapasitiWarna(kapasiti: number) {
  if (kapasiti > 80) return "#DC2626";
  if (kapasiti > 40) return "#D97706";
  return "#16A34A";
}

const STATUS_WARNA: Record<StesenStatus, string> = {
  normal: "#16A34A",
  waspada: "#EAB308",
  amaran: "#EA580C",
  bahaya: "#DC2626",
  tiada_data: "#9CA3AF",
};

const STATUS_LABEL: Record<StesenStatus, string> = {
  normal: "Normal",
  waspada: "Waspada",
  amaran: "Amaran",
  bahaya: "Bahaya",
  tiada_data: "Tiada bacaan",
};

function formatMasa(iso: string) {
  return new Date(iso).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
}

// Jarak great-circle antara dua titik (km)
function jarakKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FlyTo({ lokasi }: { lokasi: Lokasi | null }) {
  const map = useMap();
  useEffect(() => {
    if (lokasi) map.flyTo([lokasi.lat, lokasi.lng], 14, { duration: 1 });
  }, [lokasi, map]);
  return null;
}

export default function PetaBanjir() {
  const [pps, setPps] = useState<PpsResponse | null>(null);
  const [parasAir, setParasAir] = useState<ParasAirResponse | null>(null);
  const [hotspot, setHotspot] = useState<HotspotResponse | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const muatData = useCallback(async () => {
    try {
      const [ppsRes, paRes, hsRes] = await Promise.all([
        fetch("/api/banjir", { cache: "no-store" }),
        fetch("/api/paras-air", { cache: "no-store" }),
        fetch("/api/hotspot-banjir", { cache: "no-store" }),
      ]);
      const ppsJson: PpsResponse = await ppsRes.json();
      const paJson: ParasAirResponse = await paRes.json();
      const hsJson: HotspotResponse = await hsRes.json();
      setPps(ppsJson);
      setParasAir(paJson);
      setHotspot(hsJson);
      setErrMsg(ppsJson.error || paJson.error || null);
    } catch {
      setErrMsg("Gagal menyambung ke pelayan. Sila semak sambungan internet anda.");
    }
  }, []);

  useEffect(() => {
    muatData();
    const interval = setInterval(muatData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [muatData]);

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

  const pilihLokasi = (l: Lokasi) => {
    setLokasi(l);
    setQuery(l.label);
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
        setLokasi({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Lokasi Semasa Anda" });
        setQuery("Lokasi Semasa Anda");
        setSearchResults([]);
      },
      () => {
        setGpsLoading(false);
        setGpsError("Gagal mendapatkan lokasi. Pastikan kebenaran GPS dibenarkan pada pelayar.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const points = pps?.points ?? [];
  const stesenList = parasAir?.stations ?? [];
  const hotspotList = hotspot?.hotspots ?? [];
  const stesenBerisiko = useMemo(
    () => stesenList.filter((s) => s.status === "amaran" || s.status === "bahaya"),
    [stesenList]
  );

  const semakan = useMemo(() => {
    if (!lokasi) return null;

    const hotspotBerdekatan = hotspotList
      .map((h) => ({ ...h, jarak: jarakKm(lokasi.lat, lokasi.lng, h.lat, h.lng) }))
      .filter((h) => h.jarak <= HOTSPOT_RADIUS_KM)
      .sort((a, b) => a.jarak - b.jarak);

    const stesenTerdekat = [...stesenList]
      .map((s) => ({ ...s, jarak: jarakKm(lokasi.lat, lokasi.lng, s.lat, s.lng) }))
      .sort((a, b) => a.jarak - b.jarak)
      .slice(0, 3);

    const ppsBerdekatan = points
      .map((p) => ({ ...p, jarak: jarakKm(lokasi.lat, lokasi.lng, p.latti, p.longi) }))
      .filter((p) => p.jarak <= 15)
      .sort((a, b) => a.jarak - b.jarak);

    const dalamKawasanBerisiko = stesenBerisiko.some((s) => {
      const jarak = jarakKm(lokasi.lat, lokasi.lng, s.lat, s.lng);
      return jarak <= (s.status === "bahaya" ? 5 : 3);
    });

    return { hotspotBerdekatan, stesenTerdekat, ppsBerdekatan, dalamKawasanBerisiko };
  }, [lokasi, hotspotList, stesenList, points, stesenBerisiko]);

  return (
    <div>
      <div className="bg-white rounded-md shadow-sm p-4 mb-4">
        <label className="block text-sm font-medium text-brand-dark/80 mb-2">
          Cari alamat, kawasan atau bandar
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLokasi(null);
              }}
              placeholder="Cth: Taman Sri Muda, Shah Alam"
              className="w-full border border-black/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
            className="shrink-0 bg-brand-gold text-brand-dark px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
          >
            {gpsLoading ? "Mengesan..." : "📍 Guna Lokasi Saya"}
          </button>
        </div>
        {gpsError && <p className="mt-2 text-xs text-red-600">{gpsError}</p>}
      </div>

      {errMsg && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          {errMsg}
        </div>
      )}

      <div className="rounded-md overflow-hidden shadow-sm border border-black/5">
        <MapContainer
          center={MALAYSIA_CENTER}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "550px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo lokasi={lokasi} />

          {lokasi && (
            <Marker position={[lokasi.lat, lokasi.lng]} icon={markerIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Lokasi dipilih</p>
                  <p className="text-gray-600">{lokasi.label}</p>
                </div>
              </Popup>
            </Marker>
          )}

          <LayersControl position="topright">
            <LayersControl.Overlay name="PPS Banjir" checked>
              <LayerGroup>
                {points.map((p) => (
                  <CircleMarker
                    key={`pps-${p.id}`}
                    center={[p.latti, p.longi]}
                    radius={9}
                    pathOptions={{
                      color: kapasitiWarna(p.kapasiti),
                      fillColor: kapasitiWarna(p.kapasiti),
                      fillOpacity: 0.85,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-gray-600">
                          {p.mukim ? `${p.mukim}, ` : ""}
                          {p.daerah}, {p.negeri}
                        </p>
                        <p>Mangsa: {p.mangsa} | Keluarga: {p.keluarga}</p>
                        <p>Kapasiti: {p.kapasiti.toFixed(1)}%</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="Stesen Paras Air" checked>
              <LayerGroup>
                {stesenList.map((s) => (
                  <CircleMarker
                    key={`wl-${s.id}`}
                    center={[s.lat, s.lng]}
                    radius={5}
                    pathOptions={{
                      color: STATUS_WARNA[s.status],
                      fillColor: STATUS_WARNA[s.status],
                      fillOpacity: 0.9,
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-gray-600">{s.district}, {s.negeri}</p>
                        <p>
                          Status:{" "}
                          <span style={{ color: STATUS_WARNA[s.status], fontWeight: 600 }}>
                            {STATUS_LABEL[s.status]}
                          </span>
                        </p>
                        <p>Aras semasa: {s.level !== null ? `${s.level.toFixed(2)} m` : "Tiada bacaan"}</p>
                        <p className="text-xs text-gray-500">Kemas kini: {s.lastUpdate}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="Anggaran Kawasan Berisiko">
              <LayerGroup>
                {stesenBerisiko.map((s) => (
                  <Circle
                    key={`risk-${s.id}`}
                    center={[s.lat, s.lng]}
                    radius={s.status === "bahaya" ? 5000 : 3000}
                    pathOptions={{
                      color: STATUS_WARNA[s.status],
                      fillColor: STATUS_WARNA[s.status],
                      fillOpacity: 0.12,
                      weight: 1,
                      dashArray: "6 4",
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">Anggaran kawasan berisiko</p>
                        <p className="text-gray-600">Berpusat di stesen {s.name}, {s.district}</p>
                        <p className="text-xs text-amber-700">
                          Bulatan anggaran (bukan sempadan banjir rasmi) — stesen ini melebihi
                          paras {STATUS_LABEL[s.status]}.
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="Hotspot Banjir Dikenali (Selangor & KL)" checked>
              <LayerGroup>
                {hotspotList.map((h) => (
                  <CircleMarker
                    key={`hs-${h.id}`}
                    center={[h.lat, h.lng]}
                    radius={7}
                    pathOptions={{
                      color: "#7C3AED",
                      fillColor: "#7C3AED",
                      fillOpacity: 0.8,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{h.name}</p>
                        <p className="text-gray-600">{h.daerah}, {h.negeri}</p>
                        <p className="text-xs text-purple-700">
                          Disenaraikan sebagai hotspot banjir dikenali (PLANMalaysia).
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </div>

      {lokasi && semakan && (
        <div className="mt-4 bg-white rounded-md shadow-sm p-5">
          <h3 className="font-display font-bold text-lg mb-1">Semakan: {lokasi.label}</h3>

          {semakan.hotspotBerdekatan.length > 0 && (
            <p className="text-sm bg-purple-50 border border-purple-300 text-purple-800 rounded-md px-3 py-2 mb-3 font-medium">
              🟣 Lokasi ini berada dalam {HOTSPOT_RADIUS_KM}km dari hotspot banjir dikenali
              (PLANMalaysia): {semakan.hotspotBerdekatan.map((h) => h.name).join(", ")}.
            </p>
          )}

          {semakan.dalamKawasanBerisiko ? (
            <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 mb-3">
              ⚠️ Lokasi ini berada berhampiran stesen air yang <strong>sedang</strong> melebihi
              paras Amaran/Bahaya sekarang.
            </p>
          ) : (
            <p className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-2 mb-3">
              ✓ Tiada stesen air berhampiran yang sedang melebihi paras Amaran/Bahaya pada masa ini.
            </p>
          )}

          {semakan.ppsBerdekatan.length > 0 && (
            <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2 mb-3">
              Terdapat {semakan.ppsBerdekatan.length} Pusat Pemindahan Sementara (PPS) banjir yang
              pernah/sedang dibuka dalam radius 15km dari lokasi ini.
            </p>
          )}

          {semakan.stesenTerdekat.length > 0 && (
            <div className="text-sm">
              <p className="font-medium text-brand-dark/80 mb-1">Stesen paras air terdekat:</p>
              <ul className="space-y-1">
                {semakan.stesenTerdekat.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-brand-dark/70">
                    <span>
                      {s.name} ({s.district}) — {s.jarak.toFixed(1)} km
                    </span>
                    <span style={{ color: STATUS_WARNA[s.status] }} className="font-semibold">
                      {STATUS_LABEL[s.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-brand-dark/50">
            Semakan ini berdasarkan kedekatan kepada stesen paras air &amp; PPS banjir semasa —
            <strong> bukan</strong> pengesahan rasmi sama ada kawasan ini kawasan mudah banjir.
            Untuk kepastian, rujuk portal rasmi di bawah atau Pihak Berkuasa Tempatan (PBT).
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 text-xs text-brand-dark/60">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-brand-dark/80">Paras Air:</span>
          <LegendDot warna={STATUS_WARNA.normal} label="Normal" />
          <LegendDot warna={STATUS_WARNA.waspada} label="Waspada" />
          <LegendDot warna={STATUS_WARNA.amaran} label="Amaran" />
          <LegendDot warna={STATUS_WARNA.bahaya} label="Bahaya" />
          <LegendDot warna={STATUS_WARNA.tiada_data} label="Tiada bacaan" />
          <LegendDot warna="#7C3AED" label="Hotspot Banjir Dikenali" />
        </div>
        <p>
          {pps && parasAir
            ? `PPS dikemas kini ${formatMasa(pps.fetchedAt)} · Paras air dikemas kini ${formatMasa(
                parasAir.fetchedAt
              )} · Sumber: ${pps.source} & ${parasAir.source}`
            : "Memuatkan data..."}
        </p>
        {hotspot && (
          <p>
            Hotspot banjir dikemas kini {formatMasa(hotspot.fetchedAt)} · Sumber: {hotspot.source}
          </p>
        )}
      </div>
    </div>
  );
}

function LegendDot({ warna, label }: { warna: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: warna }} />
      {label}
    </span>
  );
}
