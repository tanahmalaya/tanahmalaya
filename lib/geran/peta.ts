// Geo untuk LANDHUB: bentuk lot yang dilukis atas peta satelit (Geran.penandaPeta)
// dan matematik jubin Web Mercator yang membolehkan Lot Marker melukis atas
// imej satelit dengan pentas SVG yang sama seperti gambar drone.
//
// Dalam editor, peta dilayan sebagai "gambar" gergasi dalam piksel dunia pada
// zum ZUM_ASAS, berpusat pada lokasi penyenaraian. Yang DISIMPAN pula ialah
// [lng, lat] sebenar - jadi bentuk boleh dipapar pada mana-mana peta (Leaflet,
// Google Maps, GeoJSON) dan luas boleh dikira dalam meter persegi.

import { z } from "zod";
import type { Ciri } from "./penanda";

export const ZUM_ASAS = 18; // ~0.6 m sepiksel di Malaysia
export const SAIZ_KANVAS = 8192; // piksel pada ZUM_ASAS ≈ 4.9 km persegi
export const ZUM_JUBIN_MAKS = 19;

export const JUBIN = {
  satelit: {
    url: (z: number, x: number, y: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    leaflet: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    atribusi: "Imagery © Esri, Maxar, Earthstar Geographics",
  },
  peta: {
    url: (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    leaflet: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribusi: "© OpenStreetMap contributors",
  },
} as const;

export type AsasPeta = keyof typeof JUBIN;

// Pusat lalai bila penyenaraian belum ada koordinat - tengah Semenanjung.
export const PUSAT_MALAYSIA: [number, number] = [101.9758, 4.2105];

// ---------- Web Mercator ----------

export function keDunia(lng: number, lat: number, zum: number): [number, number] {
  const skala = 256 * 2 ** zum;
  const sinLat = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  return [((lng + 180) / 360) * skala, (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * skala];
}

export function dariDunia(x: number, y: number, zum: number): [number, number] {
  const skala = 256 * 2 ** zum;
  const lng = (x / skala) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / skala;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

// ---------- Ukuran ----------

const JEJARI_BUMI = 6378137;

// Luas poligon atas sfera (m²) - formula Chamberlain & Duquette, cukup tepat
// untuk lot tanah (ralat jauh di bawah ketepatan lukisan tangan atas satelit).
export function luasGeo(cincin: [number, number][]): number {
  if (cincin.length < 3) return 0;
  let jumlah = 0;
  for (let i = 0; i < cincin.length; i += 1) {
    const [lng1, lat1] = cincin[i];
    const [lng2, lat2] = cincin[(i + 1) % cincin.length];
    jumlah +=
      ((lng2 - lng1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((jumlah * JEJARI_BUMI * JEJARI_BUMI) / 2);
}

export function pusatGeo(cincin: [number, number][]): [number, number] {
  return [
    cincin.reduce((s, p) => s + p[0], 0) / cincin.length,
    cincin.reduce((s, p) => s + p[1], 0) / cincin.length,
  ];
}

const M2_SEUNIT: Record<string, number> = { EKAR: 4046.8564224, HEKTAR: 10000, SQFT: 0.09290304 };

export function m2KeUnit(m2: number, unit: string): number {
  return m2 / (M2_SEUNIT[unit] ?? 1);
}

// ---------- Simpanan ----------

export type PenandaPeta = { ciri: Ciri[] };

const lngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-85.1).max(85.1)]);

const ciriPetaSchema = z
  .object({
    id: z.string().min(1).max(60),
    lapisan: z.enum(["lot", "jalan", "sungai", "label"]),
    bentuk: z.enum(["titik", "garis", "poligon"]),
    points: z.array(lngLat).min(1).max(300),
    lotId: z.string().max(60).nullish(),
    label: z.string().max(120).nullish(),
  })
  .refine(
    (c) =>
      (c.bentuk === "titik" && c.points.length === 1) ||
      (c.bentuk === "garis" && c.points.length >= 2) ||
      (c.bentuk === "poligon" && c.points.length >= 3),
    { message: "Shape has too few points" }
  );

export const penandaPetaSchema = z.object({ ciri: z.array(ciriPetaSchema).max(300) });

export function bacaPenandaPeta(nilai: unknown): PenandaPeta {
  const hasil = penandaPetaSchema.safeParse(nilai);
  return hasil.success ? hasil.data : { ciri: [] };
}
