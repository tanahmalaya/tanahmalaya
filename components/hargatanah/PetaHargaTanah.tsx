"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type GeocodeResult = { label: string; lat: number; lng: number };
type Lokasi = { lat: number; lng: number; label: string };

type ItemAnggaran = {
  jenisTanah: string;
  label: string;
  purataSen: number;
  bilangan: number;
  tahun: number;
  sukuan: string;
};

type AnggaranResponse = {
  daerah: string | null;
  negeri: string | null;
  dijumpai: boolean;
  items: ItemAnggaran[];
  sumber?: string;
  catatan?: string;
  error?: string;
};

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function formatRM(sen: number) {
  const rm = sen / 100;
  if (rm >= 1_000_000) return `RM${(rm / 1_000_000).toFixed(rm % 1_000_000 === 0 ? 0 : 1)} juta`;
  if (rm >= 1_000) return `RM${(rm / 1_000).toFixed(rm % 1_000 === 0 ? 0 : 1)}k`;
  return `RM${rm.toFixed(0)}`;
}

function FlyTo({ lokasi }: { lokasi: Lokasi | null }) {
  const map = useMap();
  useEffect(() => {
    if (lokasi) map.flyTo([lokasi.lat, lokasi.lng], 12, { duration: 1 });
  }, [lokasi, map]);
  return null;
}

export default function PetaHargaTanah() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [anggaran, setAnggaran] = useState<AnggaranResponse | null>(null);
  const [anggaranLoading, setAnggaranLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abaikanCarianRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abaikanCarianRef.current) {
      abaikanCarianRef.current = false;
      return;
    }
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

  useEffect(() => {
    if (!lokasi) return;
    setAnggaranLoading(true);
    setAnggaran(null);
    fetch(`/api/harga-tanah?lat=${lokasi.lat}&lng=${lokasi.lng}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setAnggaran)
      .catch(() => setAnggaran({ daerah: null, negeri: null, dijumpai: false, items: [], error: "Gagal menyemak." }))
      .finally(() => setAnggaranLoading(false));
  }, [lokasi]);

  const pilihLokasi = (l: Lokasi) => {
    abaikanCarianRef.current = true;
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
        abaikanCarianRef.current = true;
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

  return (
    <div>
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs sm:text-sm px-4 py-3 leading-relaxed">
        📊 <strong>Data rasmi NAPIC</strong> (Jabatan Penilaian &amp; Perkhidmatan Harta) —
        meliputi seluruh Malaysia, suku terkini (Q1 2026).
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(42,29,20,0.25)] border border-black/[0.04] p-4 sm:p-5 mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-brand-dark/40 mb-2">
          Cari alamat, kawasan atau bandar
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLokasi(null);
              }}
              placeholder="Cth: Bandar Baru Bangi, Selangor"
              className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm bg-black/[0.02] focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:bg-white transition-colors"
            />
            {(searchLoading || searchResults.length > 0) && (
              <div className="absolute z-[1000] mt-1.5 w-full bg-white border border-black/[0.06] rounded-xl shadow-[0_12px_32px_-8px_rgba(42,29,20,0.25)] max-h-64 overflow-auto">
                {searchLoading && <p className="px-3.5 py-2.5 text-xs text-brand-dark/50">Mencari...</p>}
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pilihLokasi(r)}
                    className="block w-full text-left px-3.5 py-2.5 text-sm hover:bg-brand-cream border-b border-black/5 last:border-0 first:rounded-t-xl last:rounded-b-xl"
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
            className="shrink-0 bg-brand-gold text-brand-dark px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
          >
            {gpsLoading ? "Mengesan..." : "📍 Guna Lokasi Saya"}
          </button>
        </div>
        {gpsError && <p className="mt-2 text-xs text-red-600">{gpsError}</p>}
      </div>

      <div className="rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-18px_rgba(42,29,20,0.3)] border border-black/[0.04]">
        <MapContainer center={MALAYSIA_CENTER} zoom={6} scrollWheelZoom={true} className="h-[420px] sm:h-[550px] w-full">
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
        </MapContainer>
      </div>

      {lokasi && (
        <div className="mt-4 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(42,29,20,0.25)] border border-black/[0.04] p-4 sm:p-5">
          {anggaranLoading && <p className="text-sm text-brand-dark/50">Menyemak anggaran harga...</p>}

          {!anggaranLoading && anggaran?.dijumpai && (
            <>
              <h3 className="font-display font-bold text-lg mb-0.5">
                Anggaran Harga Tanah — Daerah {anggaran.daerah}
              </h3>
              <p className="text-sm text-brand-dark/50 mb-4">{anggaran.negeri}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {anggaran.items.map((it) => (
                  <div
                    key={it.jenisTanah}
                    className="rounded-xl border border-black/[0.06] bg-brand-cream/60 px-4 py-3.5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark/45 mb-1.5">
                      {it.label}
                    </p>
                    <p className="text-lg font-bold text-brand-dark tabular-nums">
                      ≈ {formatRM(it.purataSen)}
                    </p>
                    <p className="text-xs text-brand-dark/40 mt-0.5">
                      purata/lot · {it.bilangan} transaksi ({it.sukuan} {it.tahun})
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-brand-dark/45 leading-relaxed">
                Anggaran ini <strong>purata peringkat daerah</strong> (bukan lot spesifik anda) —
                harga lot sebenar berbeza ikut saiz, akses jalan, dan jenis hakmilik. Sumber:{" "}
                {anggaran.sumber}
              </p>
            </>
          )}

          {!anggaranLoading && anggaran && !anggaran.dijumpai && (
            <p className="text-sm text-brand-dark/60">
              {anggaran.catatan ?? anggaran.error ?? "Tiada anggaran untuk lokasi ini."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
