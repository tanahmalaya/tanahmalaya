// Pilihan & label kongsi untuk Direktori Geran Tanah - diguna oleh borang ahli
// (components/geran/GeranForm.tsx), direktori carian (components/geran/GeranDirectory.tsx)
// dan jadual semakan admin (components/geran/GeranAdminTable.tsx).

export const JENIS_TANAH_LABEL: Record<string, string> = {
  KOSONG: "Tanah Kosong",
  PERTANIAN: "Pertanian",
  PEMBANGUNAN: "Pembangunan",
  PERUMAHAN: "Perumahan",
  PERINDUSTRIAN: "Perindustrian",
  KOMERSIAL: "Komersial",
};

export const JENIS_HAKMILIK_LABEL: Record<string, string> = {
  FREEHOLD: "Freehold",
  LEASEHOLD: "Leasehold",
  TIDAK_PASTI: "Tidak Pasti",
};

export const UNIT_KELUASAN_LABEL: Record<string, string> = {
  SQFT: "kaki persegi",
  EKAR: "ekar",
  HEKTAR: "hektar",
};

export const STATUS_GERAN_LABEL: Record<string, string> = {
  MENUNGGU_SEMAKAN: "Menunggu Semakan",
  DISAHKAN: "Disahkan",
  DITOLAK: "Ditolak",
};

export function formatRM(sen: number) {
  const rm = sen / 100;
  return `RM ${rm.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

export function formatKeluasan(keluasan: number, unit: string) {
  const nombor = keluasan.toLocaleString("en-MY", { maximumFractionDigits: 2 });
  return `${nombor} ${UNIT_KELUASAN_LABEL[unit] ?? unit}`;
}
