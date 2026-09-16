// Identiti jenama "GERAN" - berasingan daripada warna korporat PLT
// (brand.dark/brand.gold coklat) yang diguna di seluruh laman lain. Skop
// palet ni HANYA untuk laman & komponen di bawah /geran (direktori, borang
// jual, log masuk) - sengaja tak sentuh tailwind.config.ts supaya jenama PLT
// sedia ada di laman lain kekal tak berubah.
//
// Sengaja HANYA DUA warna aksen: hijau gelap + putih (tiada emas) - kekal
// mudah & kontras tinggi, sesuai gaya iOS.

export const GERAN_HEX = {
  dark: "#0E3B2E", // hijau tua - header/hero, teks utama, CTA sekunder
  mid: "#175C42", // hijau sederhana - gradient hero sahaja
  cream: "#F6F4EE", // latar belakang neutral (bukan "warna jenama", latar sahaja)
};

export const GERAN_CARD =
  "bg-white border border-black/5 border-l-4 border-l-[#0E3B2E]/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
export const GERAN_INPUT =
  "w-full bg-[#F6F4EE] border border-black/10 rounded-xl p-3 text-sm text-[#0E3B2E] placeholder-black/30 focus:border-[#0E3B2E] focus:ring-2 focus:ring-[#0E3B2E]/15 outline-none transition";
export const GERAN_LABEL = "block text-xs font-semibold mb-1.5 text-[#0E3B2E]/70";

// CTA utama: hijau pepejal + teks putih - kontras bersih atas navbar/kad
// putih (gaya pill "Register" broka), kekal "dua warna sahaja".
export const GERAN_BTN_PRIMARY =
  "w-full bg-[#0E3B2E] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-sm";
export const GERAN_BTN_PRIMARY_INLINE =
  "inline-flex w-auto bg-[#0E3B2E] text-white font-bold px-5 py-2.5 rounded-full items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition text-sm";
