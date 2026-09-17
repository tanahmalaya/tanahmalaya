// "GERAN" brand identity - separate from PLT's corporate colours
// (brand.dark/brand.gold brown) used across the rest of the site. This
// palette is scoped ONLY to pages & components under /geran (directory,
// sell form, login) - deliberately not touching tailwind.config.ts so the
// existing PLT brand elsewhere stays unchanged.
//
// Deliberately ONLY TWO accent colours: dark green + white (no gold) - kept
// simple & high contrast, iOS-style.

export const GERAN_HEX = {
  dark: "#0E3B2E", // dark green - header/hero, primary text, secondary CTA
  mid: "#175C42", // mid green - hero gradient only
  cream: "#F6F4EE", // neutral background (not a "brand colour", just a background)
};

export const GERAN_CARD =
  "bg-white border border-black/5 border-l-4 border-l-[#0E3B2E]/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
export const GERAN_INPUT =
  "w-full bg-[#F6F4EE] border border-black/10 rounded-xl p-3 text-sm text-[#0E3B2E] placeholder-black/30 focus:border-[#0E3B2E] focus:ring-2 focus:ring-[#0E3B2E]/15 outline-none transition";
export const GERAN_LABEL = "block text-xs font-semibold mb-1.5 text-[#0E3B2E]/70";

// Primary CTA: solid green + white text - clean contrast on a white
// navbar/card (broka's "Register" pill style), keeping to "two colours only".
export const GERAN_BTN_PRIMARY =
  "w-full bg-[#0E3B2E] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-sm";
export const GERAN_BTN_PRIMARY_INLINE =
  "inline-flex w-auto bg-[#0E3B2E] text-white font-bold px-5 py-2.5 rounded-full items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition text-sm";
