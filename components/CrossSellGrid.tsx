"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { PRODUCT_STATUS_LABEL, isAvailableForOrder, totalStok } from "@/lib/productSize";
import { PROMO_MULTI_ITEM_PERCENT, hargaSelepasDiskaunSen } from "@/lib/promo";
import PromoPopup from "@/components/PromoPopup";

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

/**
 * Teaser "beli lagi jimat lagi" dipaparkan di bawah setiap halaman produk -
 * harga produk LAIN dipaparkan terus dengan diskaun barang kedua/ketiga
 * (10%) supaya pelanggan tergoda tambah lebih daripada satu barang.
 */
export default function CrossSellGrid({ products }: { products: Product[] }) {
  const { cart, addToCart } = useCart();
  const [promoVariant, setPromoVariant] = useState<"congrats" | "invite" | null>(null);

  if (products.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-brand-cream">
      <p className="font-semibold mb-4">Tambah barang kedua dan ketiga dapat lagi banyak diskaun!</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((p) => {
          const tersedia = isAvailableForOrder(p);
          const hasSizes = p.sizes.length > 0;
          const hargaDiskaunSen = hargaSelepasDiskaunSen(p.hargaSen, PROMO_MULTI_ITEM_PERCENT);
          // Produk yang dah ada dalam troli TETAP dipaparkan - beli unit
          // kedua/ketiga bagi produk yang SAMA pun layak diskaun automatik.
          const kuantitiDalamTroli = cart
            .filter((c) => c.productId === p.id)
            .reduce((sum, c) => sum + c.quantity, 0);
          return (
            <div key={p.id} className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col">
              <Link href={`/merchandise/${p.id}`} className="relative aspect-square bg-brand-cream">
                {p.gambarDepan && <Image src={p.gambarDepan} alt={p.nama} fill className="object-cover" />}
                <span className="absolute top-2 left-2 bg-white/90 text-brand-dark text-[10px] font-semibold px-2 py-1 rounded-sm">
                  {PRODUCT_STATUS_LABEL[p.status] || p.status}
                </span>
              </Link>
              <div className="p-3 flex flex-col flex-1">
                <Link href={`/merchandise/${p.id}`} className="text-sm font-semibold mb-1 line-clamp-2">
                  {p.nama}
                </Link>
                <p className="text-xs mb-1">
                  <span className="text-brand-dark/40 line-through mr-1.5">{formatRM(p.hargaSen)}</span>
                  <span className="text-brand-gold font-bold">{formatRM(hargaDiskaunSen)}</span>
                </p>
                {kuantitiDalamTroli > 0 && (
                  <p className="text-[11px] text-brand-dark/50 mb-2">Dalam troli: {kuantitiDalamTroli}</p>
                )}
                {hasSizes ? (
                  <Link
                    href={`/merchandise/${p.id}`}
                    className={`mt-auto text-center bg-brand-gold text-brand-dark text-xs font-semibold py-2 rounded-sm ${
                      tersedia ? "" : "opacity-40 pointer-events-none"
                    }`}
                  >
                    {!tersedia ? "SOLD OUT" : kuantitiDalamTroli > 0 ? "TAMBAH LAGI" : "PILIH SAIZ"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const trolikosongSebelumIni = cart.length === 0;
                      addToCart({
                        id: p.id,
                        productId: p.id,
                        saiz: null,
                        name: p.nama,
                        price: p.hargaSen / 100,
                        quantity: 1,
                      });
                      setPromoVariant(trolikosongSebelumIni ? "invite" : "congrats");
                    }}
                    disabled={!tersedia}
                    className="mt-auto bg-brand-gold text-brand-dark text-xs font-semibold py-2 rounded-sm disabled:opacity-40"
                  >
                    {!tersedia ? "SOLD OUT" : kuantitiDalamTroli > 0 ? "TAMBAH LAGI" : "ADD TO CART"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {promoVariant && <PromoPopup variant={promoVariant} onClose={() => setPromoVariant(null)} />}
    </div>
  );
}
