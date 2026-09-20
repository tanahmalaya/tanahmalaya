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
  DISAHKAN: "Approved",
  DITOLAK: "Rejected",
};

export function formatRM(sen: number) {
  const rm = sen / 100;
  return `RM ${rm.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

export function formatKeluasan(keluasan: number, unit: string) {
  const nombor = keluasan.toLocaleString("en-MY", { maximumFractionDigits: 2 });
  return `${nombor} ${UNIT_KELUASAN_LABEL[unit] ?? unit}`;
}
