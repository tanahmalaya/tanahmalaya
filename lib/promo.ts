// Promo "Beli Lagi, Jimat Lagi": item PERTAMA dalam troli (ikut urutan
// ditambah) kekal harga asal; setiap produk SETERUSNYA (kedua, ketiga, ...)
// automatik dapat diskaun 10% - tak kira jenis/kategori produk.

export const PROMO_MULTI_ITEM_PERCENT = 10;

/** Peratus diskaun untuk item pada kedudukan `index` dalam troli (0 = item pertama). */
export function diskaunPercentUntukKedudukan(index: number): number {
  return index === 0 ? 0 : PROMO_MULTI_ITEM_PERCENT;
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
