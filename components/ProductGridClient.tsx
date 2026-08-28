"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";

type Product = {
  id: string;
  nama: string;
  hargaSen: number;
  gambarDepan: string | null;
  stok: number;
};

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default function ProductGridClient({ products }: { products: Product[] }) {
  const { addToCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
      {products.map((p) => (
        <div key={p.id} className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col">
          <Link href={`/merchandise/${p.id}`} className="relative aspect-square bg-brand-cream">
            {p.gambarDepan && (
              <Image src={p.gambarDepan} alt={p.nama} fill className="object-cover" />
            )}
          </Link>
          <div className="p-3 flex flex-col flex-1">
            <Link href={`/merchandise/${p.id}`} className="text-sm font-semibold mb-1 line-clamp-2">
              {p.nama}
            </Link>
            <p className="text-brand-gold font-bold text-sm mb-3">{formatRM(p.hargaSen)}</p>
            <button
              onClick={() =>
                addToCart({
                  id: p.id,
                  name: p.nama,
                  price: p.hargaSen / 100,
                  quantity: 1,
                })
              }
              disabled={p.stok <= 0}
              className="mt-auto bg-brand-gold text-brand-dark text-xs font-semibold py-2 rounded-sm disabled:opacity-40"
            >
              {p.stok > 0 ? "ADD TO CART" : "SOLD OUT"}
            </button>
          </div>
        </div>
      ))}
      {products.length === 0 && (
        <p className="col-span-full text-center text-brand-dark/50 py-10">
          Belum ada produk. Tambah dari dashboard admin.
        </p>
      )}
    </div>
  );
}
