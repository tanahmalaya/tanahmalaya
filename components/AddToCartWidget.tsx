"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { isSizeAvailable } from "@/lib/productSize";
import { isJaket } from "@/lib/promo";
import JaketPromoPopup from "@/components/JaketPromoPopup";

type SizeInfo = { saiz: string; label: string; stok: number };

export default function AddToCartWidget({
  productId,
  nama,
  price,
  stok,
  status,
  sizes = [],
}: {
  productId: string;
  nama: string;
  price: number;
  stok: number;
  status: string;
  sizes?: SizeInfo[];
}) {
  const { cart, addToCart } = useCart();
  const isPreorder = status === "PREORDER";
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.find((s) => isSizeAvailable(s, { status }))?.saiz ?? null
  );
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [promoVariant, setPromoVariant] = useState<"congrats" | "invite" | null>(null);

  const selectedSizeInfo = sizes.find((s) => s.saiz === selectedSize) || null;
  const maxQty = isPreorder
    ? 99
    : sizes.length > 0
      ? selectedSizeInfo?.stok ?? 0
      : stok || 99;

  function handleAddToCart() {
    if (sizes.length > 0 && !selectedSize) {
      setError("Sila pilih saiz dahulu.");
      return;
    }
    setError("");
    const cartId = selectedSize ? `${productId}:${selectedSize}` : productId;
    const label = selectedSizeInfo ? `${nama} (${selectedSizeInfo.label})` : nama;
    const hasJaketSebelumIni = cart.some((i) => isJaket(i.name));
    addToCart({ id: cartId, productId, saiz: selectedSize, name: label, price, quantity: qty });
    setAdded(true);
    if (isJaket(nama)) setPromoVariant("congrats");
    else if (!hasJaketSebelumIni) setPromoVariant("invite");
  }

  return (
    <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
      {sizes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold mb-2">Saiz</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.saiz}
                type="button"
                disabled={!isSizeAvailable(s, { status })}
                onClick={() => {
                  setSelectedSize(s.saiz);
                  setQty(1);
                  setAdded(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border disabled:opacity-30 disabled:line-through ${
                  selectedSize === s.saiz
                    ? "bg-brand-gold border-brand-gold text-brand-dark"
                    : "border-brand-dark/20 text-brand-dark"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Kuantiti</label>
          <input
            type="number"
            min={1}
            max={maxQty || 1}
            value={qty}
            onChange={(e) => {
              setQty(Math.max(1, Math.min(maxQty || 1, Number(e.target.value) || 1)));
              setAdded(false);
            }}
            className="w-20 border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={maxQty <= 0 || (sizes.length > 0 && !selectedSize)}
          className="flex-1 bg-brand-gold text-brand-dark font-semibold text-sm py-3 rounded-sm disabled:opacity-40"
        >
          TAMBAH KE TROLI
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {added && (
        <div className="flex items-center justify-between bg-brand-cream/60 rounded-sm p-3 text-sm">
          <span className="text-brand-dark">Ditambah ke troli.</span>
          <Link href="/cart" className="font-semibold text-brand-gold underline">
            LIHAT TROLI &amp; CHECKOUT &rarr;
          </Link>
        </div>
      )}

      {promoVariant && (
        <JaketPromoPopup variant={promoVariant} onClose={() => setPromoVariant(null)} />
      )}
    </div>
  );
}
