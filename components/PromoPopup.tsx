"use client";

import Link from "next/link";
import { PROMO_MULTI_ITEM_PERCENT } from "@/lib/promo";

type Variant = "congrats" | "invite";

const COPY: Record<Variant, { emoji: string; title: string; body: string; cta: string }> = {
  congrats: {
    emoji: "🎉",
    title: "Tahniah!",
    body: `Barang ni bukan barang pertama dalam troli anda, jadi automatik dapat diskaun ${PROMO_MULTI_ITEM_PERCENT}%!`,
    cta: "TERUSKAN MEMBELI-BELAH",
  },
  invite: {
    emoji: "💡",
    title: "Jimat Lagi!",
    body: `Tambah barang kedua, ketiga dan seterusnya ke troli untuk diskaun automatik ${PROMO_MULTI_ITEM_PERCENT}%!`,
    cta: "LIHAT PRODUK LAIN",
  },
};

export default function PromoPopup({
  onClose,
  variant = "congrats",
}: {
  onClose: () => void;
  variant?: Variant;
}) {
  const copy = COPY[variant];

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
        <p className="text-3xl mb-2">{copy.emoji}</p>
        <h2 className="font-display text-xl font-bold mb-2">{copy.title}</h2>
        <p className="text-sm text-brand-dark/70 mb-5">{copy.body}</p>
        <Link
          href="/merchandise"
          onClick={onClose}
          className="block bg-brand-gold text-brand-dark font-semibold text-sm py-3 rounded-sm mb-2"
        >
          {copy.cta}
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
