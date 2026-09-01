// Promo "Beli Lagi, Jimat Lagi": item PERTAMA dalam troli (ikut urutan
// ditambah) kekal harga asal; setiap produk SETERUSNYA (kedua, ketiga, ...)
// automatik dapat diskaun 10% - tak kira jenis/kategori produk.

export const PROMO_MULTI_ITEM_PERCENT = 10;

/**
 * Kira pecahan kuantiti "harga asal" vs "diskaun" untuk SATU baris troli,
 * ambil kira jumlah unit dalam baris-baris SEBELUM baris ni (`unitSebelumBaris`).
 * Cuma UNIT PERTAMA dalam SELURUH troli (across semua baris, ikut urutan
 * ditambah) kekal harga asal - unit kedua dan seterusnya dapat diskaun
 * automatik, termasuk unit tambahan produk yang SAMA (cth: beli 2 tukul,
 * tukul kedua pun dapat diskaun).
 */
export function pecahanUnitBaris(
  kuantiti: number,
  unitSebelumBaris: number
): { kuantitiAsal: number; kuantitiDiskaun: number } {
  const kuantitiAsal = unitSebelumBaris === 0 ? Math.min(1, kuantiti) : 0;
  return { kuantitiAsal, kuantitiDiskaun: kuantiti - kuantitiAsal };
}

/** Kira harga (dalam sen) selepas diskaun peratus, bulatkan ke sen terdekat. */
export function hargaSelepasDiskaunSen(hargaSen: number, percent: number): number {
  if (percent <= 0) return hargaSen;
  return Math.round((hargaSen * (100 - percent)) / 100);
}

/** Sama seperti hargaSelepasDiskaunSen tapi untuk nilai RM (float) - cth paparan troli client-side. */
export function hargaSelepasDiskaunRM(hargaRM: number, percent: number): number {
  const sen = Math.round(hargaRM * 100);
  return hargaSelepasDiskaunSen(sen, percent) / 100;
}
