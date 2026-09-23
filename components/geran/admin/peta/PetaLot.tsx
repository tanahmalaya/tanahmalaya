"use client";

// Peta Lot LANDHUB - semua penyenaraian (pin) dan lot yang dilukis atas peta
// satelit (poligon berwarna ikut status). Mod "penuh" untuk halaman Lots & Map
// > Lot Map dengan panel penapis; mod "ringkas" untuk kad inventori dashboard.
//
// Mesti dimuat dengan next/dynamic { ssr: false } - Leaflet menyentuh `window`.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import { JUBIN, type AsasPeta } from "@/lib/geran/peta";
import { UNIT_KELUASAN_LABEL, formatRM } from "@/lib/geran";
import { STATUS_INFO } from "@/lib/geran/status";
import type { ListingPeta, LotPeta, StatusPeta } from "@/lib/geran/data-peta";

const WARNA: Record<StatusPeta, string> = {
  AVAILABLE: "#10B981",
  RESERVED: "#F59E0B",
  SOLD: "#EF4444",
  OTHER: "#94A3B8",
};
const LABEL_STATUS: Record<StatusPeta, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  OTHER: "Not published",
};
const SEMUA_STATUS: StatusPeta[] = ["AVAILABLE", "RESERVED", "SOLD", "OTHER"];
const WARNA_JALAN = "#FBBF24";
const WARNA_SUNGAI = "#38BDF8";

// Sempadan Malaysia (Semenanjung + Borneo) - pandangan lalai bila tiada data.
const SEMPADAN_MALAYSIA: LatLngBoundsExpression = [
  [0.85, 99.6],
  [7.4, 119.3],
];

const ll = (p: [number, number]): LatLngExpression => [p[1], p[0]];

function formatRMRingkas(sen: number) {
  const rm = sen / 100;
  if (rm >= 1_000_000) return `RM${(rm / 1_000_000).toFixed(rm % 1_000_000 === 0 ? 0 : 1)}M`;
  return `RM${Math.round(rm / 1000)}k`;
}

function MuatSempadan({
  titik,
  kunci,
  onZum,
}: {
  titik: [number, number][];
  kunci: string;
  onZum: (z: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (titik.length === 0) map.fitBounds(SEMPADAN_MALAYSIA);
    else if (titik.length === 1) map.setView(ll(titik[0]), 16);
    else
      map.fitBounds(
        titik.map((p) => [p[1], p[0]] as [number, number]),
        { padding: [36, 36], maxZoom: 18 }
      );
    // Lapor zum terus: fitBounds tanpa animasi mencetuskan zoomend secara
    // serentak, dalam fasa effect yang sama di mana useMapEvents (IkutZum)
    // sedang menanggal & memasang semula pendengarnya - jadi peristiwa itu hilang.
    onZum(map.getZoom());
    // Hanya bila set hasil tapisan berubah, bukan setiap render.
  }, [kunci]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Label nama lot hanya bila cukup dekat untuk dibaca - pada zum negeri,
// berpuluh label bertindih jadi hingar.
const ZUM_LABEL = 15;

function IkutZum({ onZum }: { onZum: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZum(map.getZoom()) });
  useEffect(() => onZum(map.getZoom()), []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function PautanListing({ l, ada360 = false }: { l: ListingPeta; ada360?: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {ada360 && (
        <Link
          href={`/geran/admin/geran/${l.id}?tab=360`}
          className="rounded-md bg-violet-600 px-2.5 py-1 text-[12px] font-bold !text-white no-underline"
        >
          360° view
        </Link>
      )}
      <Link
        href={`/geran/admin/geran/${l.id}?tab=lots`}
        className="rounded-md bg-emerald-700 px-2.5 py-1 text-[12px] font-bold !text-white no-underline"
      >
        Open listing
      </Link>
      <a
        href={l.statusPeta === "OTHER" ? `/geran/${l.id}?preview=1` : `/geran/${l.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-black/15 px-2.5 py-1 text-[12px] font-semibold !text-black/70 no-underline"
      >
        Public page <ExternalLink size={11} />
      </a>
    </div>
  );
}

function PopupLot({ lot, l }: { lot: LotPeta; l: ListingPeta }) {
  return (
    <div className="min-w-[200px] text-[13px] leading-snug">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-[15px]">{lot.noLot}</strong>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: WARNA[lot.status] }}>
          {LABEL_STATUS[lot.status]}
        </span>
      </div>
      <p className="mt-1 text-black/60">
        {lot.keluasan ? `${lot.keluasan} ${UNIT_KELUASAN_LABEL[lot.unit] ?? ""}` : "Area not set"}
        {" · "}
        {lot.hargaSen ? formatRM(lot.hargaSen) : "No price"}
      </p>
      <p className="mt-1.5 text-[12px] text-black/50">
        #{l.seq} {l.tajuk}
      </p>
      <PautanListing l={l} ada360={l.kamera.some((k) => k.lotId === lot.id)} />
    </div>
  );
}

function PopupListing({ l }: { l: ListingPeta }) {
  const kira = (s: LotPeta["status"]) => l.lots.filter((x) => x.status === s).length;
  return (
    <div className="min-w-[210px] text-[13px] leading-snug">
      <strong className="text-[14px] block">{l.tajuk}</strong>
      <p className="text-black/55 text-[12px]">
        #{l.seq} · {l.daerah}, {l.negeri}
      </p>
      <p className="mt-1">
        <strong>{l.hargaSen ? formatRM(l.hargaSen) : "No price"}</strong>
        <span className="text-black/50"> · {l.keluasan} {UNIT_KELUASAN_LABEL[l.unit] ?? ""}</span>
      </p>
      <p className="mt-1 text-[12px] text-black/55">
        {STATUS_INFO[l.status].label}
        {l.lots.length > 0 && ` · ${l.lots.length} lots (${kira("AVAILABLE")} available, ${kira("RESERVED")} reserved, ${kira("SOLD")} sold)`}
      </p>
      <PautanListing l={l} />
    </div>
  );
}

export default function PetaLot({
  data,
  mod = "penuh",
}: {
  data: ListingPeta[];
  mod?: "penuh" | "ringkas";
}) {
  const hargaMaks = useMemo(() => {
    const semua = data.flatMap((l) => [l.hargaSen ?? 0, ...l.lots.map((x) => x.hargaSen ?? 0)]);
    // Bundarkan ke atas ke RM100k terdekat supaya hujung gelangsar kemas.
    return Math.max(10_000_000, Math.ceil(Math.max(0, ...semua) / 10_000_000) * 10_000_000);
  }, [data]);

  const [asas, setAsas] = useState<AsasPeta>("satelit");
  const [q, setQ] = useState("");
  const [negeri, setNegeri] = useState("");
  const [daerah, setDaerah] = useState("");
  const [status, setStatus] = useState<Set<StatusPeta>>(new Set(SEMUA_STATUS));
  const [hargaMin, setHargaMin] = useState(0);
  const [hargaHad, setHargaHad] = useState(hargaMaks);
  const [panelBuka, setPanelBuka] = useState(false);
  const [zum, setZum] = useState(6);

  const senaraiNegeri = useMemo(() => Array.from(new Set(data.map((l) => l.negeri))).sort(), [data]);
  const senaraiDaerah = useMemo(
    () => Array.from(new Set(data.filter((l) => !negeri || l.negeri === negeri).map((l) => l.daerah))).sort(),
    [data, negeri]
  );

  const dalamHarga = (sen: number | null) =>
    sen === null ? hargaMin === 0 && hargaHad >= hargaMaks : sen >= hargaMin && sen <= hargaHad;

  // Tapis: listing kelihatan bila ia sendiri lulus penapis, ATAU sekurang-
  // kurangnya satu lotnya lulus (cth. tapis "Sold" tunjuk listing aktif yang
  // ada lot terjual).
  const tapisan = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data
      .filter((l) => (!negeri || l.negeri === negeri) && (!daerah || l.daerah === daerah))
      .filter(
        (l) =>
          !t ||
          l.tajuk.toLowerCase().includes(t) ||
          l.daerah.toLowerCase().includes(t) ||
          l.negeri.toLowerCase().includes(t) ||
          String(l.seq) === t ||
          l.lots.some((x) => x.noLot.toLowerCase().includes(t))
      )
      .map((l) => {
        const lotNampak = new Set(
          l.lots.filter((x) => status.has(x.status) && dalamHarga(x.hargaSen)).map((x) => x.id)
        );
        const listingNampak = status.has(l.statusPeta) && dalamHarga(l.hargaSen);
        return { l, lotNampak, nampak: listingNampak || lotNampak.size > 0 };
      })
      .filter((x) => x.nampak);
  }, [data, q, negeri, daerah, status, hargaMin, hargaHad]); // eslint-disable-line react-hooks/exhaustive-deps

  const titikSemua = useMemo(() => {
    const p: [number, number][] = [];
    for (const { l, lotNampak } of tapisan) {
      const bentuk = l.bentuk.filter((b) => b.lapisan !== "lot" || !b.lotId || lotNampak.has(b.lotId));
      if (bentuk.length > 0) p.push(...bentuk.flatMap((b) => b.points));
      else if (l.lat !== null && l.lng !== null) p.push([l.lng, l.lat]);
    }
    return p;
  }, [tapisan]);
  const kunciSempadan = tapisan.map((x) => x.l.id + ":" + x.lotNampak.size).join(",");

  function togolStatus(s: StatusPeta) {
    setStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const tanpaLokasi = tapisan.filter((x) => x.l.lat === null && x.l.bentuk.length === 0).length;
  const ringkas = mod === "ringkas";

  const peta = (
    <div
      data-jauh={zum < ZUM_LABEL}
      className={`group/peta relative ${ringkas ? "h-[320px]" : "h-[60vh] lg:h-[calc(100vh-220px)] min-h-[420px]"} rounded-xl overflow-hidden`}
    >
      <MapContainer bounds={SEMPADAN_MALAYSIA} scrollWheelZoom className="h-full w-full" style={{ background: "#1F2A24" }}>
        <TileLayer key={asas} url={JUBIN[asas].leaflet} attribution={JUBIN[asas].atribusi} maxZoom={20} maxNativeZoom={19} />
        <MuatSempadan titik={titikSemua} kunci={kunciSempadan} onZum={setZum} />
        <IkutZum onZum={setZum} />

        {tapisan.map(({ l, lotNampak }) => {
          const lotIkutId = new Map(l.lots.map((x) => [x.id, x]));
          return l.bentuk.map((b) => {
            if (b.bentuk === "poligon") {
              const lot = b.lotId ? lotIkutId.get(b.lotId) : undefined;
              if (lot && !lotNampak.has(lot.id)) return null;
              const warna = lot ? WARNA[lot.status] : "#E5E7EB";
              return (
                <Polygon
                  key={b.id}
                  positions={b.points.map(ll)}
                  pathOptions={{ color: warna, weight: 2, fillColor: warna, fillOpacity: 0.35, dashArray: lot ? undefined : "6 4" }}
                >
                  {/* Tooltip sentiasa dipasang dan disembunyikan dengan CSS ikut
                      zum: Tooltip react-leaflet yang ditambah SELEPAS poligon
                      dipasang tak terikat pada lapisannya. */}
                  {lot && !ringkas && (
                    <Tooltip
                      direction="center"
                      permanent
                      className="!bg-transparent !border-0 !shadow-none !text-white !font-bold before:!hidden group-data-[jauh=true]/peta:!hidden"
                    >
                      <span style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>{lot.noLot}</span>
                    </Tooltip>
                  )}
                  <Popup>{lot ? <PopupLot lot={lot} l={l} /> : <PopupListing l={l} />}</Popup>
                </Polygon>
              );
            }
            if (b.bentuk === "garis") {
              return (
                <Polyline
                  key={b.id}
                  positions={b.points.map(ll)}
                  pathOptions={{ color: b.lapisan === "sungai" ? WARNA_SUNGAI : WARNA_JALAN, weight: 4 }}
                >
                  {b.label && <Tooltip sticky>{b.label}</Tooltip>}
                </Polyline>
              );
            }
            return null;
          });
        })}

        {/* Kamera 360° - pin ungu kecil; klik terus ke tab 360° listing. */}
        {!ringkas &&
          tapisan.flatMap(({ l }) =>
            l.kamera.map((k) => (
              <CircleMarker
                key={`kam-${k.id}`}
                center={[k.lat, k.lng]}
                radius={6}
                pathOptions={{ color: "#fff", weight: 2, fillColor: "#8B5CF6", fillOpacity: 1 }}
              >
                <Tooltip>📷 {k.tajuk || "360° camera"}</Tooltip>
                <Popup>
                  <div className="min-w-[180px] text-[13px]">
                    <strong>📷 {k.tajuk || "360° camera"}</strong>
                    <p className="text-[12px] text-black/55 mt-0.5">#{l.seq} {l.tajuk}</p>
                    <PautanListing l={l} ada360 />
                  </div>
                </Popup>
              </CircleMarker>
            ))
          )}

        {tapisan.map(({ l }) =>
          l.lat !== null && l.lng !== null ? (
            <CircleMarker
              key={`pin-${l.id}`}
              center={[l.lat, l.lng]}
              radius={l.bentuk.length > 0 ? 5 : 8}
              pathOptions={{ color: "#fff", weight: 2, fillColor: WARNA[l.statusPeta], fillOpacity: 1 }}
            >
              <Popup>
                <PopupListing l={l} />
              </Popup>
            </CircleMarker>
          ) : null
        )}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[500] flex rounded-lg bg-white/95 p-0.5 text-xs font-semibold shadow">
        {(["satelit", "peta"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAsas(a)}
            className={`rounded-md px-2.5 py-1 ${asas === a ? "bg-[#0B2A1F] text-white" : "text-black/60"}`}
          >
            {a === "satelit" ? "Satellite" : "Map"}
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-[11.5px] shadow space-y-1">
        {SEMUA_STATUS.map((s) => (
          <p key={s} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: WARNA[s] }} />
            {LABEL_STATUS[s]}
          </p>
        ))}
      </div>

      {ringkas && senaraiNegeri.length > 1 && (
        <select
          value={negeri}
          onChange={(e) => {
            setNegeri(e.target.value);
            setDaerah("");
          }}
          aria-label="State"
          className="absolute top-3 left-14 z-[500] h-8 rounded-lg border-0 bg-white/95 px-2 text-xs font-semibold shadow"
        >
          <option value="">All states</option>
          {senaraiNegeri.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  if (ringkas) return peta;

  const INPUT = "w-full h-9 rounded-lg border border-black/[0.12] bg-white px-2.5 text-sm outline-none focus:border-emerald-600/60";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 self-start">
        <button
          type="button"
          onClick={() => setPanelBuka((v) => !v)}
          className="lg:hidden w-full flex items-center justify-between text-sm font-bold"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filters
          </span>
          <span className="text-black/45 font-normal">{tapisan.length} listings</span>
        </button>
        <div className={`${panelBuka ? "mt-4" : "hidden"} lg:block space-y-4`}>
          <label className="relative block">
            <span className="sr-only">Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lot, land, location..." className={`${INPUT} pr-8`} />
            <Search size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/35" />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-black/55 mb-1">State</span>
            <select
              value={negeri}
              onChange={(e) => {
                setNegeri(e.target.value);
                setDaerah("");
              }}
              className={INPUT}
            >
              <option value="">All states</option>
              {senaraiNegeri.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-black/55 mb-1">District</span>
            <select value={daerah} onChange={(e) => setDaerah(e.target.value)} className={INPUT}>
              <option value="">All districts</option>
              {senaraiDaerah.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-xs font-semibold text-black/55 mb-1.5">Status</legend>
            <div className="space-y-1.5">
              {SEMUA_STATUS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={status.has(s)} onChange={() => togolStatus(s)} className="accent-emerald-700 w-4 h-4" />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: WARNA[s] }} />
                  {LABEL_STATUS[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-black/55 mb-1.5">Price</legend>
            <div className="flex justify-between text-xs font-semibold text-black/70 mb-1">
              <span>{formatRMRingkas(hargaMin)}</span>
              <span>{hargaHad >= hargaMaks ? `${formatRMRingkas(hargaMaks)}+` : formatRMRingkas(hargaHad)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={hargaMaks}
              step={hargaMaks / 100}
              value={hargaMin}
              onChange={(e) => setHargaMin(Math.min(Number(e.target.value), hargaHad))}
              aria-label="Minimum price"
              className="w-full accent-emerald-700"
            />
            <input
              type="range"
              min={0}
              max={hargaMaks}
              step={hargaMaks / 100}
              value={hargaHad}
              onChange={(e) => setHargaHad(Math.max(Number(e.target.value), hargaMin))}
              aria-label="Maximum price"
              className="w-full accent-emerald-700"
            />
          </fieldset>

          <div className="pt-3 border-t border-black/[0.06] text-xs text-black/50 space-y-1">
            <p>
              <strong className="text-black/75">{tapisan.length}</strong> listings ·{" "}
              <strong className="text-black/75">{tapisan.reduce((n, x) => n + x.lotNampak.size, 0)}</strong> lots
            </p>
            {tanpaLokasi > 0 && (
              <p>{tanpaLokasi} listing(s) have no coordinates or map drawing yet, so they are not on the map.</p>
            )}
          </div>
        </div>
      </div>
      {peta}
    </div>
  );
}
