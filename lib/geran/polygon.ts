// Bentuk data polygon sempadan tanah yang admin lukis atas gambar
// penyenaraian GERAN. Dikongsi antara editor admin (components/geran/polygon),
// route kemas kini (app/api/geran-admin/geran/update) dan overlay awam
// (components/geran/PolygonOverlay).
//
// Semua koordinat TERNORMAL 0..1 relatif kepada bingkai media, bukan piksel.
// Sebab: gambar yang sama dipapar pada banyak saiz (thumbnail, galeri, skrin
// telefon). Dengan koordinat ternormal, overlay SVG sentiasa jatuh tepat tanpa kita perlu tahu
// saiz sebenar masa render.

import { z } from "zod";

export type Titik = [number, number];

// Satu lot/sub-bahagian tanah dalam gambar - penyenaraian tanah lombong/ladang
// selalunya dipecah jual ikut lot (Lot 1, Lot 2, ...), masing-masing dengan
// harga sendiri. `id` stabil merentasi sunting (bukan indeks array) supaya
// React dan kod sunting tak keliru bila lot disusun semula atau dibuang.
export type LotPolygon = {
  id: string;
  points: Titik[];
  label?: string | null;
  hargaSen?: number | null;
};

export type GambarLots = {
  // Dimensi asal gambar masa lot dilukis. Perlu sebab galeri awam papar
  // gambar dengan object-cover: tanpa tahu nisbah asal, kita tak boleh tiru
  // pangkasan yang sama pada overlay dan polygon akan tersasar pada gambar
  // yang bukan 16:9. Dikongsi oleh semua lot dalam gambar yang sama.
  w?: number | null;
  h?: number | null;
  lots: LotPolygon[];
};

// Dikunci mengikut URL gambar (bukan indeks) supaya lot kekal terikat pada
// gambar yang betul walaupun admin susun semula atau buang gambar lain.
export type GambarPolygons = Record<string, GambarLots>;

export const MAX_LOT_SETIAP_GAMBAR = 30;

export const MAX_TITIK_POLYGON = 60;

const titikSchema = z.tuple([z.number().min(-0.5).max(1.5), z.number().min(-0.5).max(1.5)]);

// Titik dibenarkan keluar sedikit dari bingkai (-0.5..1.5) sebab sempadan tanah
// selalunya terpotong di tepi gambar dan admin perlu letak bucu di luar rangka
// supaya garisan melintas dengan sudut yang betul.
const lotSchema = z.object({
  id: z.string().min(1).max(40),
  points: z.array(titikSchema).min(3).max(MAX_TITIK_POLYGON),
  label: z.string().max(80).nullish(),
  // Sen (bukan RM) supaya konsisten dengan cara duit disimpan di seluruh
  // aplikasi ni (lihat Geran.hargaSiaranSen dll) dan elak ralat bulat float.
  hargaSen: z.number().int().nonnegative().nullish(),
});

const gambarLotsSchema = z.object({
  w: z.number().positive().max(20000).nullish(),
  h: z.number().positive().max(20000).nullish(),
  lots: z.array(lotSchema).min(1).max(MAX_LOT_SETIAP_GAMBAR),
});

export const gambarPolygonsSchema = z.record(z.string().url(), gambarLotsSchema);

// Bentuk LAMA (sebelum sokongan berbilang lot) - satu polygon setiap gambar,
// tiada pembungkus `lots`. Dikekalkan hanya untuk migrasi bacaan data sedia
// ada dalam pangkalan data; jangan tulis dalam bentuk ni lagi.
const bentukLamaSchema = z.object({
  points: z.array(titikSchema).min(3).max(MAX_TITIK_POLYGON),
  label: z.string().max(80).nullish(),
  w: z.number().positive().max(20000).nullish(),
  h: z.number().positive().max(20000).nullish(),
});

// ---------- Baca balik dari Prisma Json ----------
// Kolum Json boleh mengandungi apa sahaja yang pernah ditulis, termasuk data
// dari versi skema lama. Jangan sekali-kali percaya bentuknya - parse dulu,
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

    // Format lama: satu polygon terus pada peringkat gambar (tiada `lots`).
    // Migrasi jadi SATU lot supaya penyenaraian sedia ada terus kelihatan
    // dalam editor & halaman awam yang baharu, tanpa perlu skrip migrasi DB.
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

// ---------- Pemetaan ke bingkai yang dipangkas ----------

// Pecahan bingkai media yang masih kelihatan bila ia dimuatkan ke dalam bekas
// bernisbah lain dengan cara "cover" (dipangkas di tengah). Dikongsi oleh
// panduan pangkas dalam editor admin dan penjana gambar kongsi, supaya
// kedua-duanya tak boleh terpesong daripada satu sama lain.
export function pecahanKelihatanCover(
  lebarMedia: number,
  tinggiMedia: number,
  lebarKeluar: number,
  tinggiKeluar: number
): { fx: number; fy: number } {
  const nisbahMedia = lebarMedia / tinggiMedia;
  const nisbahKeluar = lebarKeluar / tinggiKeluar;
  return nisbahMedia > nisbahKeluar
    ? { fx: nisbahKeluar / nisbahMedia, fy: 1 }
    : { fx: 1, fy: nisbahMedia / nisbahKeluar };
}

// Tukar titik ternormal (relatif kepada media PENUH) kepada piksel dalam imej
// keluaran yang sudah dipangkas gaya "cover". Titik yang jatuh dalam jalur yang
// terpangkas akan keluar di luar sempadan keluaran - itu betul, garisan polygon
// masih patut melintas tepi imej dengan sudut yang sama.
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

// ---------- Bantuan lukisan ----------

// "x1,y1 x2,y2 ..." untuk atribut points pada <polygon> SVG, dalam sistem
// koordinat viewBox 0 0 100 100 supaya overlay boleh regang ikut saiz bekas.
export function titikKeSvg(points: Titik[], skala = 100): string {
  return points.map(([x, y]) => `${(x * skala).toFixed(3)},${(y * skala).toFixed(3)}`).join(" ");
}

// Buang lot yang gambarnya sudah tiada dalam penyenaraian, dan mana-mana lot
// yang belum lengkap (<3 bucu - draf yang masih dilukis). Dipanggil masa
// simpan supaya kolum Json tak kumpul sampah URL blob yang dah dibuang atau
// lot separuh jalan yang tak sah ikut gambarPolygonsSchema.
export function tapisPolygonGambar(polygons: GambarPolygons, gambarUrls: string[]): GambarPolygons {
  const dibenarkan = new Set(gambarUrls);
  const hasil: GambarPolygons = {};
  for (const [url, entri] of Object.entries(polygons)) {
    if (!dibenarkan.has(url)) continue;
    const lots = entri.lots.filter((l) => l.points.length >= 3);
    if (lots.length > 0) hasil[url] = { ...entri, lots };
  }
  return hasil;
}

export function bundarkanTitik(points: Titik[]): Titik[] {
  return points.map(([x, y]) => [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000] as Titik);
}
