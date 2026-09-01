"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROMO_ROUND_NECK_PERCENT, PROMO_LAIN_PERCENT, isJaket } from "@/lib/promo";

type Variant = "congrats" | "invite";

const COPY: Record<Variant, { emoji: string; title: string; body: string; cta: string }> = {
  congrats: {
    emoji: "🎉",
    title: "Tahniah!",
    body: "Dengan pembelian jaket anda, anda layak mendapat diskaun automatik untuk barangan lain dalam troli:",
    cta: "TAMBAH BARANGAN LAIN",
  },
  invite: {
    emoji: "💡",
    title: "Jimat Lagi!",
    body: "Tambah jaket ke troli dan dapat diskaun automatik untuk barangan dalam troli anda:",
    cta: "TAMBAH JAKET",
  },
};

export default function JaketPromoPopup({
  onClose,
  variant = "congrats",
}: {
  onClose: () => void;
  variant?: Variant;
}) {
  const copy = COPY[variant];
  // Untuk "invite" - CTA kena bawa terus ke produk jaket (bukan senarai produk
  // umum) supaya pelanggan boleh terus tambah jaket dan layak diskaun.
  const [ctaHref, setCtaHref] = useState("/merchandise");

  useEffect(() => {
    if (variant !== "invite") return;
    fetch("/api/products")
      .then((res) => res.json())
      .then((products: { id: string; nama: string }[]) => {
        const jaket = products.find((p) => isJaket(p.nama));
        if (jaket) setCtaHref(`/merchandise/${jaket.id}`);
      })
      .catch(() => {});
  }, [variant]);

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
        <p className="text-sm text-brand-dark/70 mb-4">{copy.body}</p>
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
          href={variant === "invite" ? ctaHref : "/merchandise"}
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
