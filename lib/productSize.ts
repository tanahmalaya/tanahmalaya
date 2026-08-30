// Pilihan saiz baju yang disokong. Nilai enum DB guna "XXL"/"XXXL" (Prisma
// enum tak boleh mula dengan digit) tapi dipaparkan sebagai "2XL"/"3XL".
export const SIZE_OPTIONS = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "2XL" },
  { value: "XXXL", label: "3XL" },
] as const;

export type SizeValue = (typeof SIZE_OPTIONS)[number]["value"];

export const SIZE_LABEL: Record<string, string> = Object.fromEntries(
  SIZE_OPTIONS.map((s) => [s.value, s.label])
);

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  READY_STOCK: "Ready Stock",
  PREORDER: "Pre-order",
};

/** Jumlah stok produk - kalau ada saiz, jumlahkan stok setiap saiz; kalau tidak, guna field stok produk terus. */
export function totalStok(product: { stok: number; sizes?: { stok: number }[] }) {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.reduce((sum, s) => sum + s.stok, 0);
  }
  return product.stok;
}

/**
 * Produk boleh dibeli ke tidak. PREORDER sentiasa boleh dibeli (dibuat ikut
 * tempahan, bukan had stok sedia ada) - READY_STOCK perlu ada stok > 0.
 */
export function isAvailableForOrder(product: {
  status: string;
  stok: number;
  sizes?: { stok: number }[];
}) {
  if (product.status === "PREORDER") return true;
  return totalStok(product) > 0;
}

/** Sama macam isAvailableForOrder tapi untuk satu saiz - PREORDER abaikan stok saiz tu. */
export function isSizeAvailable(size: { stok: number }, product: { status: string }) {
  if (product.status === "PREORDER") return true;
  return size.stok > 0;
}

/** Baca input saiz_S, saiz_M, ... daripada FormData - kosong = saiz tak ditawarkan. */
export function parseSizesFromForm(form: FormData) {
  return SIZE_OPTIONS.map((s) => {
    const raw = form.get(`saiz_${s.value}`);
    if (raw === null || String(raw).trim() === "") return null;
    const stok = parseInt(String(raw), 10);
    if (!Number.isFinite(stok) || stok < 0) return null;
    return { saiz: s.value, stok };
  }).filter((s): s is { saiz: SizeValue; stok: number } => s !== null);
}
