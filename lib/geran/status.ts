// Workflow status penyenaraian LANDHUB - SATU tempat untuk label, warna,
// siapa boleh nampak, dan peraturan peralihan. Selamat diimport dari komponen
// klien (tiada Prisma). Lihat enum StatusGeran dalam prisma/schema.prisma.
//
//   DRAFT -> SUBMITTED -> UNDER_REVIEW -> VERIFIED -> PUBLISHED -> RESERVED -> SOLD
//   (+ REJECTED & ARCHIVED sebagai jalan keluar dari mana-mana peringkat)

export const STATUS_GERAN = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "REJECTED",
  "ARCHIVED",
] as const;

export type StatusGeranKey = (typeof STATUS_GERAN)[number];

type InfoStatus = {
  label: string;
  // Ayat ringkas untuk penjual di /geran/jual (bukan istilah dalaman admin).
  labelPenjual: string;
  badge: string; // kelas Tailwind: latar, teks, ring
  dot: string;
  hex: string; // untuk carta SVG
};

// Warna ikut maksud: kelabu = belum mula, kuning = perlu tindakan admin,
// biru/indigo = sedang diproses, hijau = tersiar, ungu = ditempah,
// teal gelap = selesai, merah = ditolak, kelabu gelap = arkib.
export const STATUS_INFO: Record<StatusGeranKey, InfoStatus> = {
  DRAFT: {
    label: "Draft",
    labelPenjual: "Draft",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    hex: "#94A3B8",
  },
  SUBMITTED: {
    label: "Submitted",
    labelPenjual: "Pending review",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    hex: "#F59E0B",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    labelPenjual: "Under review",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    hex: "#0EA5E9",
  },
  VERIFIED: {
    label: "Verified",
    labelPenjual: "Verified — publishing soon",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
    hex: "#6366F1",
  },
  PUBLISHED: {
    label: "Published",
    labelPenjual: "Published",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    hex: "#10B981",
  },
  RESERVED: {
    label: "Reserved",
    labelPenjual: "Reserved",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    hex: "#8B5CF6",
  },
  SOLD: {
    label: "Sold",
    labelPenjual: "Sold",
    badge: "bg-teal-50 text-teal-800 ring-teal-200",
    dot: "bg-teal-700",
    hex: "#0F766E",
  },
  REJECTED: {
    label: "Rejected",
    labelPenjual: "Not approved",
    badge: "bg-red-50 text-red-600 ring-red-200",
    dot: "bg-red-500",
    hex: "#EF4444",
  },
  ARCHIVED: {
    label: "Archived",
    labelPenjual: "Archived",
    badge: "bg-zinc-100 text-zinc-500 ring-zinc-200",
    dot: "bg-zinc-500",
    hex: "#71717A",
  },
};

// Kelihatan dalam direktori awam, sitemap & senarai "serupa".
export const STATUS_DIREKTORI: StatusGeranKey[] = ["PUBLISHED", "RESERVED"];

// Halaman butiran awam juga dibuka untuk SOLD - pautan yang sudah dikongsi di
// WhatsApp tak patut jadi 404 sebaik tanah terjual; ia papar lencana Sold.
export const STATUS_BUTIRAN_AWAM: StatusGeranKey[] = ["PUBLISHED", "RESERVED", "SOLD"];

// Status yang menunjukkan harga kepada awam - mesti ada hargaSiaranSen.
export const STATUS_PERLU_HARGA: StatusGeranKey[] = STATUS_BUTIRAN_AWAM;

// Kumpulan sub-menu "Land" dalam sidebar LANDHUB (?status=...).
export const KUMPULAN_STATUS: Record<string, { label: string; statuses: StatusGeranKey[] }> = {
  draft: { label: "Draft", statuses: ["DRAFT"] },
  pending: { label: "Pending Review", statuses: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"] },
  active: { label: "Active", statuses: ["PUBLISHED", "RESERVED"] },
  sold: { label: "Sold", statuses: ["SOLD"] },
  archived: { label: "Archived", statuses: ["ARCHIVED", "REJECTED"] },
};

export function isStatusGeran(nilai: unknown): nilai is StatusGeranKey {
  return typeof nilai === "string" && (STATUS_GERAN as readonly string[]).includes(nilai);
}

// Semak peralihan status dari editor admin. Admin dibenar lompat ke mana-mana
// peringkat (cth. terus PUBLISHED untuk stok GT yang dah disemak), tapi dua
// syarat data tetap dikuatkuasa. Pulangkan mesej ralat, atau null jika sah.
export function semakPeralihan(
  baru: StatusGeranKey,
  data: { hargaSiaranSen: bigint | number | null; catatanAdmin: string | null }
): string | null {
  if (STATUS_PERLU_HARGA.includes(baru) && !data.hargaSiaranSen) {
    return `Set a listing price before changing the status to ${STATUS_INFO[baru].label}.`;
  }
  if (baru === "REJECTED" && !data.catatanAdmin?.trim()) {
    return "Add a rejection reason (admin note) before rejecting this listing.";
  }
  return null;
}

// Cap masa yang perlu ditulis bila status berubah - direkod kali pertama
// sahaja, supaya "tarikh siar" tak beranjak setiap kali admin tukar balik
// dari RESERVED ke PUBLISHED.
export function capMasaStatus(
  baru: StatusGeranKey,
  sedia: { publishedAt: Date | null; soldAt: Date | null },
  kini = new Date()
): { publishedAt?: Date; soldAt?: Date } {
  const keluar: { publishedAt?: Date; soldAt?: Date } = {};
  if (STATUS_BUTIRAN_AWAM.includes(baru) && !sedia.publishedAt) keluar.publishedAt = kini;
  if (baru === "SOLD" && !sedia.soldAt) keluar.soldAt = kini;
  return keluar;
}
