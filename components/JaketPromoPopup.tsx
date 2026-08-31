"use client";

import Link from "next/link";
import { PROMO_ROUND_NECK_PERCENT, PROMO_LAIN_PERCENT } from "@/lib/promo";

export default function JaketPromoPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-md shadow-lg max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-brand-dark/40 text-2xl leading-none"
          aria-label="Tutup"
        >
          &times;
        </button>
        <p className="text-3xl mb-2">🎉</p>
        <h2 className="font-display text-xl font-bold mb-2">Promo Jaket!</h2>
        <p className="text-sm text-brand-dark/70 mb-4">
          Jaket dah masuk troli anda. Diskaun automatik dah dikira dalam troli:
        </p>
        <div className="space-y-2 mb-5 text-left">
          <div className="flex items-center justify-between bg-brand-cream/60 rounded-sm px-4 py-2">
            <span className="text-sm font-semibold">T-shirt</span>
            <span className="text-brand-gold font-bold text-sm">-{PROMO_ROUND_NECK_PERCENT}%</span>
          </div>
          <div className="flex items-center justify-between bg-brand-cream/60 rounded-sm px-4 py-2">
            <span className="text-sm font-semibold">Barangan lain</span>
            <span className="text-brand-gold font-bold text-sm">-{PROMO_LAIN_PERCENT}%</span>
          </div>
        </div>
        <Link
          href="/merchandise"
          onClick={onClose}
          className="block bg-brand-gold text-brand-dark font-semibold text-sm py-3 rounded-sm mb-2"
        >
          TAMBAH BARANGAN LAIN
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="block w-full text-brand-dark/60 text-xs font-semibold py-1"
        >
          Teruskan tanpa tambah
        </button>
      </div>
    </div>
  );
}
