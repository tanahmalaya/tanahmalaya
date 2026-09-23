// Format polygon WARISAN GERAN (Geran.gambarPolygons) - sebelum Lot Marker.
// Data baru ditulis dalam Geran.penandaLot (lib/geran/penanda.ts); fail ini
// hanya membaca data lama supaya penyenaraian yang dilukis dulu masih papar
// sempadan dan boleh ditukar ke format baru bila dibuka dalam editor.
//
// Semua koordinat TERNORMAL 0..1 relatif kepada gambar penuh, bukan piksel.

import { z } from "zod";

export type Titik = [number, number];

export type LotPolygon = {
  id: string;
  points: Titik[];
  label?: string | null;
  hargaSen?: number | null;
};

export type GambarLots = {
  // Dimensi asal gambar masa lot dilukis - perlu untuk meniru pangkasan
  // object-cover galeri awam.
  w?: number | null;
  h?: number | null;
  lots: LotPolygon[];
};

export type GambarPolygons = Record<string, GambarLots>;

const titikSchema = z.tuple([z.number().min(-0.5).max(1.5), z.number().min(-0.5).max(1.5)]);

const lotSchema = z.object({
  id: z.string().min(1).max(40),
  points: z.array(titikSchema).min(3).max(60),
  label: z.string().max(80).nullish(),
  hargaSen: z.number().int().nonnegative().nullish(),
});

const gambarLotsSchema = z.object({
  w: z.number().positive().max(20000).nullish(),
  h: z.number().positive().max(20000).nullish(),
  lots: z.array(lotSchema).min(1).max(30),
});

// Bentuk paling lama - satu polygon setiap gambar tanpa pembungkus `lots`.
const bentukLamaSchema = z.object({
  points: z.array(titikSchema).min(3).max(60),
  label: z.string().max(80).nullish(),
  w: z.number().positive().max(20000).nullish(),
  h: z.number().positive().max(20000).nullish(),
});

// Kolum Json boleh mengandungi apa sahaja yang pernah ditulis - parse dulu,
// dan pulangkan kosong kalau tak padan, supaya halaman awam tak pecah.
export function bacaGambarPolygons(nilai: unknown): GambarPolygons {
  if (!nilai || typeof nilai !== "object") return {};

  const keluar: GambarPolygons = {};
  for (const [url, mentah] of Object.entries(nilai as Record<string, unknown>)) {
    if (!mentah || typeof mentah !== "object") continue;

    if (Array.isArray((mentah as { lots?: unknown }).lots)) {
      const hasil = gambarLotsSchema.safeParse(mentah);
      if (hasil.success) keluar[url] = hasil.data;
      continue;
    }

    const lama = bentukLamaSchema.safeParse(mentah);
    if (lama.success) {
      keluar[url] = {
        w: lama.data.w ?? null,
        h: lama.data.h ?? null,
        lots: [{ id: "warisan", points: lama.data.points, label: lama.data.label ?? null, hargaSen: null }],
      };
    }
  }
  return keluar;
}

// ---------- Pemetaan ke bingkai yang dipangkas (og:image) ----------

// Pecahan media yang masih kelihatan bila dimuatkan ke bekas bernisbah lain
// dengan cara "cover" (dipangkas di tengah).
function pecahanKelihatanCover(lebarMedia: number, tinggiMedia: number, lebarKeluar: number, tinggiKeluar: number) {
  const nisbahMedia = lebarMedia / tinggiMedia;
  const nisbahKeluar = lebarKeluar / tinggiKeluar;
  return nisbahMedia > nisbahKeluar
    ? { fx: nisbahKeluar / nisbahMedia, fy: 1 }
    : { fx: 1, fy: nisbahMedia / nisbahKeluar };
}

// Tukar titik ternormal (relatif kepada media PENUH) kepada piksel dalam imej
// keluaran yang sudah dipangkas gaya "cover". Titik dalam jalur terpangkas
// jatuh di luar sempadan keluaran - itu betul, garisan masih melintas tepi.
export function titikKeCoverPx(
  points: Titik[],
  lebarMedia: number,
  tinggiMedia: number,
  lebarKeluar: number,
  tinggiKeluar: number
): Array<[number, number]> {
  const { fx, fy } = pecahanKelihatanCover(lebarMedia, tinggiMedia, lebarKeluar, tinggiKeluar);
  const asalX = (1 - fx) / 2;
  const asalY = (1 - fy) / 2;
  return points.map(([x, y]) => [((x - asalX) / fx) * lebarKeluar, ((y - asalY) / fy) * tinggiKeluar]);
}
