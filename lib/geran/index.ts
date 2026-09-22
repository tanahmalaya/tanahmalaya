// Shared options & labels for the Geran Land Directory - used by the seller
// form (components/geran/GeranForm.tsx), the search directory
// (components/geran/GeranDirectory.tsx) and the admin review table
// (components/geran/GeranAdminTable.tsx).

export const JENIS_TANAH_LABEL: Record<string, string> = {
  KOSONG: "Vacant Land",
  PERTANIAN: "Agricultural",
  PEMBANGUNAN: "Development",
  PERUMAHAN: "Residential",
  PERINDUSTRIAN: "Industrial",
  KOMERSIAL: "Commercial",
};

export const JENIS_HAKMILIK_LABEL: Record<string, string> = {
  FREEHOLD: "Freehold",
  LEASEHOLD: "Leasehold",
  TIDAK_PASTI: "Uncertain",
};

// Status pemilikan - lihat enum StatusPemilikan dalam prisma/schema.prisma.
// Istilah Melayu dikekalkan walaupun laman awam berbahasa Inggeris, kerana
// "Malay Reserve" dan "Bumi Lot" memang itulah sebutan yang dipakai dalam
// urusan tanah Malaysia; menterjemahkannya lebih jauh hanya mengelirukan.
export const STATUS_PEMILIKAN_LABEL: Record<string, string> = {
  RIZAB_MELAYU: "Malay Reserve Land",
  LOT_BUMI: "Bumi Lot",
  LOT_NON_BUMI: "Non-Bumi Lot",
  TIDAK_PASTI: "Uncertain",
};

// Penjelasan ringkas untuk pembeli yang tak biasa dengan istilah ini. Dipapar
// di halaman butiran, bukan dalam dropdown.
export const STATUS_PEMILIKAN_NOTA: Record<string, string> = {
  RIZAB_MELAYU: "Gazetted Malay Reserve — ownership can only be transferred to Malays.",
  LOT_BUMI: "Bumiputera quota lot — transfer to a non-Bumiputera buyer needs state consent.",
  LOT_NON_BUMI: "No ethnic restriction on transfer of title.",
  TIDAK_PASTI: "Not yet confirmed — PLT verifies this against the land title during review.",
};

export const UNIT_KELUASAN_LABEL: Record<string, string> = {
  SQFT: "sq ft",
  EKAR: "acre",
  HEKTAR: "hectare",
};

// Sumber penyenaraian - lihat enum SumberGeran dalam prisma/schema.prisma.
// SUMBER_GERAN_LABEL untuk dashboard admin, SUMBER_GERAN_PUBLIC_LABEL untuk
// direktori awam (ayat penuh supaya pembeli faham siapa yang menyenaraikan).
export const SUMBER_GERAN_LABEL: Record<string, string> = {
  PLT: "PLT",
  KJ_LAND: "KJ Land",
  PENGGUNA: "Website User",
};

export const SUMBER_GERAN_PUBLIC_LABEL: Record<string, string> = {
  PLT: "Listed by PLT",
  KJ_LAND: "Listed by KJ Land Consultant",
  PENGGUNA: "Listed by owner",
};

// Sumber yang admin boleh pilih bila masuk penyenaraian sendiri - PENGGUNA
// hanya datang dari borang /geran/jual, bukan dari admin.
export const SUMBER_ADMIN_OPTIONS = ["PLT", "KJ_LAND"] as const;

export const STATUS_GERAN_LABEL: Record<string, string> = {
  MENUNGGU_SEMAKAN: "Pending Review",
  DALAM_RUNDINGAN: "In Negotiation",
  DISAHKAN: "Approved",
  DITOLAK: "Rejected",
};

// ---------- Had muat naik ----------
// SATU tempat sahaja untuk semua had saiz fail GERAN. Sebelum ini nombor yang
// sama disalin antara komponen klien dan route pelayan; bila salah satu diubah,
// yang lain senyap-senyap terpesong dan penggunanya dapat sama ada penolakan
// yang mengelirukan di tengah muat naik, atau fail besar yang sepatutnya
// dihalang awal-awal.
export const MAX_GAMBAR_GERAN = 8;
export const MAX_SAIZ_GAMBAR_BYTES = 10 * 1024 * 1024;
export const MAX_SAIZ_SALINAN_BYTES = 15 * 1024 * 1024;

// Video TIDAK dimuat naik ke mana-mana - ia dibuka terus dari komputer admin
// untuk kerja jejak polygon (lihat components/geran/polygon/VideoPolygonEditor).
// Jadi had ini bukan tentang kos storan; ia melindungi sesi penyuntingan itu
// sendiri. Fail 4K yang sangat besar menjadikan setiap lompatan bingkai perlahan
// sehingga auto-jejak mengambil masa berpuluh minit, sedangkan kanvas jejak
// hanya bekerja pada 640px lebar - ketajaman tambahan itu langsung tak dipakai.
export const MAX_SAIZ_VIDEO_BYTES = 200 * 1024 * 1024;

export function formatSaizFail(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

// Terima pautan youtube.com/watch?v=, youtu.be/ dan youtube.com/embed/,
// pulangkan ID video sahaja supaya halaman butiran boleh bina URL embed
// sendiri. null bermakna pautan itu bukan YouTube yang sah.
export function idVideoYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  const padanan =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  return padanan ? padanan[1] : null;
}

export function formatRM(sen: number) {
  const rm = sen / 100;
  return `RM ${rm.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

export function formatKeluasan(keluasan: number, unit: string) {
  const nombor = keluasan.toLocaleString("en-MY", { maximumFractionDigits: 2 });
  return `${nombor} ${UNIT_KELUASAN_LABEL[unit] ?? unit}`;
}

// Terima ringkasan harga macam mana orang sebenarnya taip - "233k", "2.5jt",
// "450000" atau "RM 233,000" - dan pulangkan angka RM penuh. Singkatan yang
// dikenali (k/ribu/rb = beribu, jt/juta/mil/m = berjuta) sama macam yang
// dikenali huraiIklanTanah() dalam lib/geran/parse.ts, supaya admin tak perlu
// ingat dua konvensyen berbeza untuk dua tempat berbeza. null bermakna teks tu
// bukan nombor harga yang sah.
export function huraiRinggit(teksMentah: string): number | null {
  const teks = teksMentah
    .trim()
    .toLowerCase()
    .replace(/rm/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!teks) return null;

  const padan = teks.match(/^(\d+(?:\.\d+)?)\s*(juta|jt|mil(?:lion)?|m|ribu|rb|k)?$/);
  if (!padan) return null;

  const nombor = Number(padan[1]);
  if (!Number.isFinite(nombor) || nombor <= 0) return null;

  const akhiran = padan[2];
  const gandaan = akhiran ? (/^(juta|jt|mil(?:lion)?|m)$/.test(akhiran) ? 1_000_000 : 1_000) : 1;

  return Math.round(nombor * gandaan * 100) / 100;
}
