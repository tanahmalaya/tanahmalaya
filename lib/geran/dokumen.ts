// Document Vault LANDHUB - jenis dokumen, tahap akses & had muat naik.
// Selamat diimport dari klien (tiada Prisma).

export const JENIS_DOKUMEN = {
  GERAN: "Land Title (Geran)",
  CARIAN_RASMI: "Official Search",
  PELAN_TANAH: "Land Plan",
  RESIT_CUKAI: "Quit Rent Receipt",
  IC_PEMILIK: "Owner IC",
  SPA: "SPA",
  PENILAIAN: "Valuation Report",
  LAIN: "Other",
} as const;

export type JenisDokumenKey = keyof typeof JENIS_DOKUMEN;
export const SENARAI_JENIS_DOKUMEN = Object.keys(JENIS_DOKUMEN) as JenisDokumenKey[];

// Senarai semak dalam vault - "Other" tak termasuk kerana ia bukan wajib.
export const DOKUMEN_SENARAI_SEMAK: JenisDokumenKey[] = [
  "GERAN",
  "CARIAN_RASMI",
  "PELAN_TANAH",
  "RESIT_CUKAI",
  "IC_PEMILIK",
  "SPA",
  "PENILAIAN",
];

export const AKSES_DOKUMEN = {
  ADMIN: { label: "Admin only", nota: "Only LANDHUB admins", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
  CONSULTANT: { label: "Consultant", nota: "Admins & assigned consultants", badge: "bg-sky-50 text-sky-700 ring-sky-200" },
  BUYER: { label: "Buyer", nota: "Signed-in GERAN users", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  PUBLIC: { label: "Public", nota: "Anyone viewing the listing", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
} as const;

export type AksesDokumenKey = keyof typeof AKSES_DOKUMEN;
export const SENARAI_AKSES = Object.keys(AKSES_DOKUMEN) as AksesDokumenKey[];

// Lalai yang selamat mengikut jenis: dokumen yang ada data peribadi pemilik
// (IC, SPA, geran penuh) TAK PERNAH lalai kepada awam.
export const AKSES_LALAI: Record<JenisDokumenKey, AksesDokumenKey> = {
  GERAN: "ADMIN",
  CARIAN_RASMI: "ADMIN",
  PELAN_TANAH: "BUYER",
  RESIT_CUKAI: "ADMIN",
  IC_PEMILIK: "ADMIN",
  SPA: "ADMIN",
  PENILAIAN: "CONSULTANT",
  LAIN: "ADMIN",
};

// Dokumen jenis ini mengandungi nama, no. KP & alamat pemilik - editor
// memberi amaran bila admin cuba buka kepada awam.
export const DOKUMEN_SENSITIF: JenisDokumenKey[] = ["GERAN", "CARIAN_RASMI", "IC_PEMILIK", "SPA", "RESIT_CUKAI"];

export const MIME_DOKUMEN = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SAIZ_DOKUMEN_BYTES = 20 * 1024 * 1024;
export const MAX_DOKUMEN = 40;

export function formatSaiz(bait: number): string {
  if (bait >= 1024 * 1024) return `${(bait / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bait / 1024))} KB`;
}
