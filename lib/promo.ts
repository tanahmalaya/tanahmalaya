// Promo "Beli Jaket": bila troli ada sekurang-kurangnya 1 jaket, barangan lain
// dalam troli tu automatik dapat diskaun - 10% untuk T-shirt, 5% untuk
// barangan lain. Jaket sendiri tak dapat diskaun (item pencetus promo).
//
// Kategori produk dikenal pasti daripada NAMA produk (tiada medan kategori
// berasingan) - pastikan nama produk jaket ada perkataan "jaket"/"jacket",
// dan nama t-shirt ada perkataan "t-shirt"/"tshirt".

export const PROMO_ROUND_NECK_PERCENT = 10;
export const PROMO_LAIN_PERCENT = 5;

export function isJaket(nama: string): boolean {
  const n = nama.toLowerCase();
  return n.includes("jaket") || n.includes("jacket");
}

export function isTshirt(nama: string): boolean {
  const n = nama.toLowerCase();
  return n.includes("t-shirt") || n.includes("tshirt") || n.includes("t shirt");
}

/** Peratus diskaun promo jaket untuk satu produk, diberi troli ada jaket atau tidak. */
export function diskaunPercentUntuk(nama: string, hasJaketDalamTroli: boolean): number {
  if (!hasJaketDalamTroli || isJaket(nama)) return 0;
  return isTshirt(nama) ? PROMO_ROUND_NECK_PERCENT : PROMO_LAIN_PERCENT;
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
