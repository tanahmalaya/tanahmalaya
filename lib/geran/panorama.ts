// Panorama 360° LANDHUB - jenis hotspot, bentuk data & had muat naik.
// Selamat diimport dari klien (tiada Prisma).
//
// Kedudukan hotspot disimpan sebagai yaw/pitch dalam DARJAH (bukan radian):
// yaw 0 = tengah gambar equirectangular, positif ke kanan; pitch positif ke
// atas. Darjah lebih mudah dibaca bila memeriksa data mentah.

import { z } from "zod";

export const JENIS_HOTSPOT = {
  LOT_BOUNDARY: { label: "Lot Boundary", emoji: "📍", warna: "#10B981" },
  MAIN_ROAD: { label: "Main Road", emoji: "🛣️", warna: "#FBBF24" },
  ACCESS_ROAD: { label: "Access Road", emoji: "🚗", warna: "#F59E0B" },
  RIVER: { label: "River", emoji: "🌊", warna: "#38BDF8" },
  WATER_SOURCE: { label: "Water Source", emoji: "💧", warna: "#0EA5E9" },
  HOUSE: { label: "House", emoji: "🏠", warna: "#F97316" },
  BUILDING: { label: "Building", emoji: "🏢", warna: "#A855F7" },
  TREE: { label: "Tree", emoji: "🌳", warna: "#22C55E" },
  ELECTRIC_POLE: { label: "Electric Pole", emoji: "⚡", warna: "#EAB308" },
  VIEW_POINT: { label: "View Point", emoji: "👁️", warna: "#EC4899" },
  INFO: { label: "Info", emoji: "ⓘ", warna: "#FFFFFF" },
  // Anak panah "Explore" - bawa pembeli ke panorama lain (lawatan maya).
  EXPLORE: { label: "Explore (go to another 360°)", emoji: "➜", warna: "#FFFFFF" },
} as const;

export type JenisHotspot = keyof typeof JENIS_HOTSPOT;
export const SENARAI_JENIS_HOTSPOT = Object.keys(JENIS_HOTSPOT) as JenisHotspot[];

export type Hotspot = {
  id: string;
  jenis: JenisHotspot;
  yaw: number;
  pitch: number;
  label: string | null;
  // Rujuk LotForm.kunci dalam editor; id Lot sebenar dalam DB.
  lotId: string | null;
  // EXPLORE sahaja: panorama sasaran (kunci dalam editor, id dalam DB).
  keScene: string | null;
};

export const MAX_HOTSPOT = 60;
export const MAX_PANORAMA = 12;

// Panorama dimampat ke WebP dalam pelayar (≤ 8192 px lebar) sebelum muat
// naik; had ini hanya jaring keselamatan kalau pemampatan gagal.
export const MAX_SAIZ_360_BYTES = 25 * 1024 * 1024;
export const LEBAR_MAKS_360 = 8192;

export const hotspotSchema = z.object({
  id: z.string().min(1).max(60),
  jenis: z.enum(SENARAI_JENIS_HOTSPOT as [JenisHotspot, ...JenisHotspot[]]),
  yaw: z.number().min(-360).max(360),
  pitch: z.number().min(-90).max(90),
  label: z.string().trim().max(120).nullable(),
  lotId: z.string().max(60).nullable(),
  keScene: z.string().max(60).nullable(),
});

export function bacaHotspot(nilai: unknown): Hotspot[] {
  const hasil = z.array(hotspotSchema).safeParse(nilai);
  return hasil.success ? hasil.data : [];
}

// Tajuk hotspot untuk paparan: label admin, atau nama jenisnya.
export function tajukHotspot(h: Pick<Hotspot, "jenis" | "label">): string {
  return h.label?.trim() || JENIS_HOTSPOT[h.jenis].label.replace(/ \(.*\)$/, "");
}
