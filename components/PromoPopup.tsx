"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import { isAvailableForOrder } from "@/lib/productSize";
import { PROMO_MULTI_ITEM_PERCENT, hargaSelepasDiskaunSen } from "@/lib/promo";

type Variant = "congrats" | "invite";

const COPY: Record<Variant, { emoji: string; title: string }> = {
  congrats: {
    emoji: "🎉",
    title: "Tahniah! Barang ni dapat diskaun automatik.",
  },
  invite: {
    emoji: "💡",
    title: "Jimat Lagi!",
  },
};

type Product = {
  id: string;
  nama: string;
  hargaSen: number;
  gambarDepan: string | null;
  stok: number;
  status: string;
  sizes: { saiz: string; stok: number }[];
};

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

const MAX_SHOWN = 3;

export default function PromoPopup({
  onClose,
  variant = "congrats",
}: {
  onClose: () => void;
  variant?: Variant;
}) {
  const copy = COPY[variant];
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  function kuantitiDalamTroli(productId: string) {
    return cart.filter((c) => c.productId === productId).reduce((sum, c) => sum + c.quantity, 0);
  }

  // Papar SEMUA produk (termasuk yang dah ada dalam troli - beli unit
  // kedua/ketiga produk yang SAMA pun layak diskaun). Utamakan produk yang
  // dah ada dalam troli dulu (paling relevan untuk "beli lagi").
  const barangLain = [...(products ?? [])]
    .sort((a, b) => (kuantitiDalamTroli(b.id) > 0 ? 1 : 0) - (kuantitiDalamTroli(a.id) > 0 ? 1 : 0))
    .slice(0, MAX_SHOWN);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-md shadow-lg max-w-sm w-full p-6"
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
        <p className="text-3xl mb-2 text-center">{copy.emoji}</p>
        <h2 className="font-display text-lg font-bold mb-1 text-center">{copy.title}</h2>
        <p className="text-xs text-brand-dark/60 mb-4 text-center">
          Tambah barang di bawah untuk diskaun automatik {PROMO_MULTI_ITEM_PERCENT}%:
        </p>

        {barangLain.length > 0 && (
          <div className="space-y-2 mb-4">
            {barangLain.map((p) => {
              const tersedia = isAvailableForOrder(p);
              const hasSizes = p.sizes.length > 0;
              const hargaDiskaunSen = hargaSelepasDiskaunSen(p.hargaSen, PROMO_MULTI_ITEM_PERCENT);
              const kuantitiSedia = kuantitiDalamTroli(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-brand-cream/40 rounded-sm p-2"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-brand-cream rounded-sm overflow-hidden">
                    {p.gambarDepan && (
                      <Image src={p.gambarDepan} alt={p.nama} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-dark truncate">{p.nama}</p>
                    <p className="text-xs">
                      <span className="text-brand-dark/40 line-through mr-1">{formatRM(p.hargaSen)}</span>
                      <span className="text-brand-gold font-bold">{formatRM(hargaDiskaunSen)}</span>
                    </p>
                    {kuantitiSedia > 0 && (
                      <p className="text-[10px] text-brand-dark/50">Dalam troli: {kuantitiSedia}</p>
                    )}
                  </div>
                  {hasSizes ? (
                    <Link
                      href={`/merchandise/${p.id}`}
                      onClick={onClose}
                      className={`flex-shrink-0 bg-brand-gold text-brand-dark text-[11px] font-semibold px-3 py-1.5 rounded-sm ${
                        tersedia ? "" : "opacity-40 pointer-events-none"
                      }`}
                    >
                      {!tersedia ? "SOLD OUT" : kuantitiSedia > 0 ? "TAMBAH LAGI" : "PILIH SAIZ"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={!tersedia}
                      onClick={() => {
                        addToCart({
                          id: p.id,
                          productId: p.id,
                          saiz: null,
                          name: p.nama,
                          price: p.hargaSen / 100,
                          quantity: 1,
                        });
                        onClose();
                      }}
                      className="flex-shrink-0 bg-brand-gold text-brand-dark text-[11px] font-semibold px-3 py-1.5 rounded-sm disabled:opacity-40"
                    >
                      {!tersedia ? "SOLD OUT" : kuantitiSedia > 0 ? "TAMBAH LAGI" : "TAMBAH"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
