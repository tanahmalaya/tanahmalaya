"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker, Circle, LayersControl, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type WakafPoint = { id: number; lat: number; lng: number };

type NegeriRingkas = { slug: string; label: string; agensi: string; adaSediaAda: boolean };

type WakafResponse = {
  negeri: string | null;
  agensi: string | null;
  jenis: "sedia_ada" | "cadangan" | null;
  points: WakafPoint[];
  senaraiNegeri: NegeriRingkas[];
  fetchedAt: string;
  source: string;
  error?: string;
};

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];
const BUFFER_RADIUS_M = 60; // anggaran sahaja — bukan sempadan lot rasmi

function formatMasa(iso: string) {
  return new Date(iso).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
}

function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function PetaWakaf() {
  const [negeriSlug, setNegeriSlug] = useState("selangor");
  const [data, setData] = useState<WakafResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tunjukAnggaran, setTunjukAnggaran] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const salinKoordinat = useCallback((p: WakafPoint) => {
    const text = `${p.lat}, ${p.lng}`;

    async function salin() {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopiedId(p.id);
        setTimeout(() => setCopiedId((cur) => (cur === p.id ? null : cur)), 1500);
      } catch {
        // gagal salin secara automatik - pengguna masih nampak koordinat untuk salin manual
      }
    }

    salin();
  }, []);

  const muatData = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wakaf?negeri=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json: WakafResponse = await res.json();
      setData(json);
    } catch {
      setData((prev) => ({
        negeri: null,
        agensi: null,
        jenis: null,
        points: [],
        senaraiNegeri: prev?.senaraiNegeri ?? [],
        fetchedAt: new Date().toISOString(),
        source: "MyGeoportal (JUPEM)",
        error: "Gagal menyambung ke pelayan. Sila semak sambungan internet anda.",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData(negeriSlug);
  }, [negeriSlug, muatData]);

  const senaraiNegeri = data?.senaraiNegeri ?? [];
  const points = data?.points ?? [];

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(42,29,20,0.25)] border border-black/[0.04] p-4 sm:p-5 mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-brand-dark/40 mb-2">
          Pilih negeri
        </label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 sm:flex-none sm:w-72">
            <select
              value={negeriSlug}
              onChange={(e) => setNegeriSlug(e.target.value)}
              className="w-full appearance-none border border-black/10 rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-medium bg-black/[0.02] focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:bg-white transition-colors"
            >
              {senaraiNegeri.length === 0 && <option value={negeriSlug}>Memuatkan...</option>}
              {senaraiNegeri.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.label} ({n.agensi}){!n.adaSediaAda ? " — cadangan projek sahaja" : ""}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <label className="inline-flex items-center gap-2.5 text-sm text-brand-dark/70 cursor-pointer select-none">
            <span className="relative inline-flex h-6 w-10 shrink-0 items-center">
              <input
                type="checkbox"
                checked={tunjukAnggaran}
                onChange={(e) => setTunjukAnggaran(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-black/15 peer-checked:bg-brand-gold transition-colors duration-200" />
              <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
            </span>
            Anggaran kawasan
          </label>

          {loading && (
            <span className="text-xs text-brand-dark/40 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse" />
              Memuatkan...
            </span>
          )}
        </div>

        {data?.jenis === "cadangan" && (
          <p className="mt-3 text-xs bg-amber-50 border border-amber-200/70 text-amber-800 rounded-xl px-3.5 py-2.5 leading-relaxed">
            Negeri ini belum ada lapisan lokasi tanah wakaf sedia ada dalam MyGeoportal — titik yang
            dipaparkan ialah <strong>cadangan pembangunan projek</strong> di atas tanah wakaf, bukan
            senarai lengkap tanah wakaf sedia ada.
          </p>
        )}

        {data?.error && (
          <p className="mt-3 text-xs bg-red-50 border border-red-200/70 text-red-700 rounded-xl px-3.5 py-2.5">
            {data.error}
          </p>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-18px_rgba(42,29,20,0.3)] border border-black/[0.04]">
        <MapContainer
          center={MALAYSIA_CENTER}
          zoom={6}
          scrollWheelZoom={true}
          className="h-[420px] sm:h-[550px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LayersControl position="topright">
            <LayersControl.Overlay name="Lokasi Tanah Wakaf" checked>
              <LayerGroup>
                {points.map((p) => (
                  <CircleMarker
                    key={`wakaf-${p.id}`}
                    center={[p.lat, p.lng]}
                    radius={7}
                    pathOptions={{
                      color: "#0F766E",
                      fillColor: "#14B8A6",
                      fillOpacity: 0.9,
                      weight: 1.5,
                    }}
                  >
                    <Popup closeButton minWidth={190}>
                      <div className="text-xs leading-relaxed">
                        <p className="font-semibold text-brand-dark">
                          {data?.jenis === "cadangan" ? "Cadangan Projek Tanah Wakaf" : "Tanah Wakaf"}
                        </p>
                        <p className="text-gray-600">
                          {data?.negeri} — {data?.agensi}
                        </p>
                        <p className="text-gray-500 font-mono text-[11px] mt-1">
                          {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1.5 text-teal-700 font-medium hover:text-teal-800"
                        >
                          Buka di Google Maps →
                        </a>
                        <br />
                        <button
                          type="button"
                          onClick={() => salinKoordinat(p)}
                          className="mt-1.5 inline-flex items-center gap-1 border border-black/10 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-brand-dark hover:border-black/20 transition-colors"
                        >
                          <IconCopy />
                          {copiedId === p.id ? "Disalin!" : "Salin Koordinat"}
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            {tunjukAnggaran && (
              <LayersControl.Overlay name="Anggaran Kawasan (Bukan Sempadan Rasmi)" checked>
                <LayerGroup>
                  {points.map((p) => (
                    <Circle
                      key={`buffer-${p.id}`}
                      center={[p.lat, p.lng]}
                      radius={BUFFER_RADIUS_M}
                      pathOptions={{
                        color: "#0F766E",
                        fillColor: "#14B8A6",
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: "5 4",
                      }}
                    />
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>
            )}
          </LayersControl>
        </MapContainer>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-xs text-brand-dark/50">
        <p className="font-medium text-brand-dark/70">
          {data
            ? `${points.length} lokasi dipaparkan untuk ${data.negeri ?? "-"} · Dikemas kini ${formatMasa(
                data.fetchedAt
              )}`
            : "Memuatkan data..."}
        </p>
        {data && <p className="text-brand-dark/40">Sumber: {data.source}</p>}
        <p className="text-brand-dark/40 leading-relaxed">
          Nota: Data ini hanya menunjukkan <strong>titik lokasi</strong> tanah wakaf daripada servis GIS
          awam MyGeoportal (JUPEM). Bulatan anggaran yang dipaparkan <strong>bukan</strong> sempadan lot
          sebenar — sempadan cadastral sebenar hanya ada dalam data rasmi Pejabat Tanah dan Galian (PTG)
          / JUPEM yang tidak terbuka kepada awam.
        </p>
      </div>
    </div>
  );
}
