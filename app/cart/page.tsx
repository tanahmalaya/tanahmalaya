"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import CheckoutSteps from "@/components/CheckoutSteps";
import BackButton from "@/components/BackButton";
import CrossSellGrid from "@/components/CrossSellGrid";
import { diskaunPercentUntukKedudukan, hargaSelepasDiskaunRM } from "@/lib/promo";

type Product = {
  id: string;
  nama: string;
  hargaSen: number;
  gambarDepan: string | null;
  stok: number;
  status: string;
  sizes: { saiz: string; stok: number }[];
};

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useCart();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setAllProducts)
      .catch(() => {});
  }, []);

  // Barang yang belum ada dalam troli - ni yang layak jadi "barang
  // seterusnya" dan dapat diskaun 10% automatik bila ditambah.
  const barangLain = allProducts.filter((p) => !cart.some((c) => c.productId === p.id));

  const cartWithPromo = cart.map((item, index) => {
    const percent = diskaunPercentUntukKedudukan(index);
    const hargaSelepasDiskaun = hargaSelepasDiskaunRM(item.price, percent);
    return { ...item, percent, hargaSelepasDiskaun };
  });
  const subtotal = cartWithPromo.reduce((sum, item) => sum + item.hargaSelepasDiskaun * item.quantity, 0);
  const jimat = cartWithPromo.reduce(
    (sum, item) => sum + (item.price - item.hargaSelepasDiskaun) * item.quantity,
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackButton href="/merchandise" label="Kembali ke Merchandise" className="mb-4" />
      <CheckoutSteps current="cart" />
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">Troli</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md shadow-sm border border-brand-cream">
          <p className="text-gray-600 mb-4">Troli anda masih kosong.</p>
          <Link
            href="/merchandise"
            className="inline-block bg-brand-gold text-brand-dark font-semibold px-6 py-2 rounded-sm text-sm"
          >
            LIHAT MERCHANDISE
          </Link>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
          {cart.length > 1 && (
            <div className="bg-brand-gold/15 border border-brand-gold/40 rounded-sm px-4 py-3 text-sm text-brand-dark">
              🎉 <strong>Diskaun aktif!</strong> Barang kedua dan seterusnya dapat 10% diskaun automatik.
            </div>
          )}
          <div className="space-y-3">
            {cartWithPromo.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-brand-cream pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                  {item.percent > 0 ? (
                    <p className="text-xs">
                      <span className="text-brand-dark/40 line-through mr-1.5">RM{item.price.toFixed(2)}</span>
                      <span className="text-brand-gold font-semibold">
                        RM{item.hargaSelepasDiskaun.toFixed(2)} / unit (-{item.percent}%)
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-brand-dark/60">RM{item.price.toFixed(2)} / unit</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center border border-brand-dark/20 rounded-sm font-semibold leading-none disabled:opacity-30"
                    aria-label={`Kurangkan kuantiti ${item.name}`}
                  >
                    &minus;
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, Math.min(99, item.quantity + 1))}
                    className="w-7 h-7 flex items-center justify-center border border-brand-dark/20 rounded-sm font-semibold leading-none"
                    aria-label={`Tambahkan kuantiti ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">
                  RM{(item.hargaSelepasDiskaun * item.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 text-lg leading-none px-1"
                  aria-label={`Buang ${item.name} daripada troli`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {jimat > 0 && (
            <div className="flex justify-between items-center text-sm text-brand-gold font-semibold">
              <span>Jimat (Diskaun Barang Kedua+)</span>
              <span>-RM{jimat.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-brand-cream">
            <span className="font-semibold">Subtotal</span>
            <span className="font-bold text-lg text-brand-gold">RM{subtotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-brand-dark/50">Kos penghantaran akan dikira di langkah seterusnya.</p>

          <button
            type="button"
            onClick={() => router.push("/checkout/information")}
            className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full"
          >
            TERUSKAN KE MAKLUMAT
          </button>
        </div>
      )}

      {cart.length > 0 && <CrossSellGrid products={barangLain} />}
    </div>
  );
}
