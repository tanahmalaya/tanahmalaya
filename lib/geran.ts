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
