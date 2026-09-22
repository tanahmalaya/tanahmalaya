// Bentuk data polygon sempadan tanah yang admin lukis atas gambar & video
// penyenaraian GERAN. Dikongsi antara editor admin (components/geran/polygon),
// route kemas kini (app/api/geran-admin/geran/update) dan overlay awam
// (components/geran/PolygonOverlay).
//
// Semua koordinat TERNORMAL 0..1 relatif kepada bingkai media, bukan piksel.
// Sebab: gambar yang sama dipapar pada banyak saiz (thumbnail, galeri, skrin
// telefon) dan video YouTube dibenamkan pada lebar yang berubah-ubah. Dengan
// koordinat ternormal, overlay SVG sentiasa jatuh tepat tanpa kita perlu tahu
// saiz sebenar masa render.

import { z } from "zod";

export type Titik = [number, number];

export type BentukPolygon = {
  points: Titik[];
  label?: string | null;
  // Dimensi asal gambar masa polygon dilukis. Perlu sebab galeri awam papar
  // gambar dengan object-cover: tanpa tahu nisbah asal, kita tak boleh tiru
  // pangkasan yang sama pada overlay dan polygon akan tersasar pada gambar
  // yang bukan 16:9.
  w?: number | null;
  h?: number | null;
};

// Dikunci mengikut URL gambar (bukan indeks) supaya polygon kekal terikat pada
// gambar yang betul walaupun admin susun semula atau buang gambar lain.
export type GambarPolygons = Record<string, BentukPolygon>;

export type KeyframePolygon = {
  t: number; // saat dari mula video
  points: Titik[];
};

export type VideoPolygonTrack = {
  version: 1;
  namaFail: string | null; // untuk amaran kalau admin buka fail lain nanti
  durasi: number; // saat - dibanding dengan durasi YouTube untuk kesan trim
  lebar: number; // dimensi asal video - embed YouTube letterbox video yang
  tinggi: number; // bukan 16:9, jadi overlay perlu tiru kotak yang sama
  offsetMasa: number; // saat, pembetulan kalau potongan YouTube tak sama
  label?: string | null;
  keyframes: KeyframePolygon[]; // sentiasa diisih menaik ikut t
};

export const MAX_TITIK_POLYGON = 60;
export const MAX_KEYFRAME_TRACK = 900;

const titikSchema = z.tuple([z.number().min(-0.5).max(1.5), z.number().min(-0.5).max(1.5)]);

// Titik dibenarkan keluar sedikit dari bingkai (-0.5..1.5) sebab sempadan tanah
// selalunya terpotong di tepi gambar dan admin perlu letak bucu di luar rangka
// supaya garisan melintas dengan sudut yang betul.
const bentukSchema = z.object({
  points: z.array(titikSchema).min(3).max(MAX_TITIK_POLYGON),
  label: z.string().max(80).nullish(),
  w: z.number().positive().max(20000).nullish(),
  h: z.number().positive().max(20000).nullish(),
});

export const gambarPolygonsSchema = z.record(z.string().url(), bentukSchema);

export const videoPolygonTrackSchema = z.object({
  version: z.literal(1),
  namaFail: z.string().max(260).nullish(),
  durasi: z.number().min(0).max(60 * 60 * 6),
  lebar: z.number().positive().max(20000),
  tinggi: z.number().positive().max(20000),
  offsetMasa: z.number().min(-3600).max(3600),
  label: z.string().max(80).nullish(),
  keyframes: z
    .array(z.object({ t: z.number().min(0), points: z.array(titikSchema).min(3).max(MAX_TITIK_POLYGON) }))
    .min(1)
    .max(MAX_KEYFRAME_TRACK),
});

// ---------- Baca balik dari Prisma Json ----------
// Kolum Json boleh mengandungi apa sahaja yang pernah ditulis, termasuk data
// dari versi skema lama. Jangan sekali-kali percaya bentuknya - parse dulu,
// dan pulangkan kosong kalau tak padan, supaya halaman awam tak pecah.

export function bacaGambarPolygons(nilai: unknown): GambarPolygons {
  if (!nilai || typeof nilai !== "object") return {};
  const hasil = gambarPolygonsSchema.safeParse(nilai);
  if (!hasil.success) return {};
  return hasil.data as GambarPolygons;
}

export function bacaVideoTrack(nilai: unknown): VideoPolygonTrack | null {
  if (!nilai || typeof nilai !== "object") return null;
  const hasil = videoPolygonTrackSchema.safeParse(nilai);
  if (!hasil.success) return null;
  const track = hasil.data as VideoPolygonTrack;
  return { ...track, keyframes: [...track.keyframes].sort((a, b) => a.t - b.t) };
}

// ---------- Interpolasi masa ----------

function lerpTitik(a: Titik, b: Titik, f: number): Titik {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

// Polygon pada saat `masa`, atau null kalau masa itu di luar julat yang admin
// betul-betul jejak. Kita SENGAJA tak "bekukan" polygon di luar julat: kalau
// admin hanya jejak 10 saat pertama, membiarkan polygon terapung sepanjang baki
// video akan tunjukkan sempadan di tempat yang salah kepada pembeli.
export function polygonPadaMasa(track: VideoPolygonTrack, masa: number): Titik[] | null {
  const kf = track.keyframes;
  if (kf.length === 0) return null;

  const t = masa - track.offsetMasa;
  const pertama = kf[0];
  const akhir = kf[kf.length - 1];
  if (t < pertama.t - 0.001 || t > akhir.t + 0.001) return null;
  if (kf.length === 1) return pertama.points;

  let i = 0;
  while (i < kf.length - 2 && kf[i + 1].t <= t) i += 1;

  const a = kf[i];
  const b = kf[i + 1];
  const julat = b.t - a.t;
  const f = julat <= 0 ? 0 : Math.min(1, Math.max(0, (t - a.t) / julat));

  // Jejak sentiasa kekalkan bilangan bucu, tapi keyframe boleh datang dari
  // suntingan manual admin yang menambah/membuang bucu. Bila bilangannya tak
  // sama, interpolasi per-bucu tak bermakna - lompat terus ke keyframe terdekat.
  if (a.points.length !== b.points.length) return f < 0.5 ? a.points : b.points;

  return a.points.map((titik, idx) => lerpTitik(titik, b.points[idx], f));
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

// Buang polygon yang gambarnya sudah tiada dalam penyenaraian. Dipanggil masa
// simpan supaya kolum Json tak kumpul sampah URL blob yang dah dibuang.
export function tapisPolygonGambar(polygons: GambarPolygons, gambarUrls: string[]): GambarPolygons {
  const dibenarkan = new Set(gambarUrls);
  const hasil: GambarPolygons = {};
  for (const [url, bentuk] of Object.entries(polygons)) {
    if (dibenarkan.has(url)) hasil[url] = bentuk;
  }
  return hasil;
}

// ---------- Pemampatan keyframe ----------
// Auto-jejak menghasilkan satu keyframe setiap langkah (cth 10 sesaat). Untuk
// video 3 minit itu ~1800 keyframe - terlalu besar untuk disimpan dan tak perlu,
// sebab pergerakan drone licin dan interpolasi linear sudah cukup tepat.
// Kita buang keyframe yang boleh diteka semula dari jirannya dalam had `epsilon`
// (jarak ternormal), gaya Douglas-Peucker atas paksi masa.
export function mampatKeyframes(keyframes: KeyframePolygon[], epsilon = 0.0025): KeyframePolygon[] {
  if (keyframes.length <= 2) return keyframes;

  const simpan = new Array<boolean>(keyframes.length).fill(false);
  simpan[0] = true;
  simpan[keyframes.length - 1] = true;

  const tugasan: Array<[number, number]> = [[0, keyframes.length - 1]];
  while (tugasan.length > 0) {
    const [mula, tamat] = tugasan.pop()!;
    if (tamat - mula < 2) continue;

    const a = keyframes[mula];
    const b = keyframes[tamat];
    const julat = b.t - a.t;
    let terburukIdx = -1;
    let terburuk = epsilon;

    for (let i = mula + 1; i < tamat; i += 1) {
      const kf = keyframes[i];
      if (kf.points.length !== a.points.length || a.points.length !== b.points.length) {
        terburukIdx = i;
        terburuk = Infinity;
        break;
      }
      const f = julat <= 0 ? 0 : (kf.t - a.t) / julat;
      let ralat = 0;
      for (let j = 0; j < kf.points.length; j += 1) {
        const teka = lerpTitik(a.points[j], b.points[j], f);
        ralat = Math.max(ralat, Math.hypot(teka[0] - kf.points[j][0], teka[1] - kf.points[j][1]));
      }
      if (ralat > terburuk) {
        terburuk = ralat;
        terburukIdx = i;
      }
    }

    if (terburukIdx >= 0) {
      simpan[terburukIdx] = true;
      tugasan.push([mula, terburukIdx], [terburukIdx, tamat]);
    }
  }

  return keyframes.filter((_, i) => simpan[i]);
}

export function bundarkanTitik(points: Titik[]): Titik[] {
  return points.map(([x, y]) => [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000] as Titik);
}
