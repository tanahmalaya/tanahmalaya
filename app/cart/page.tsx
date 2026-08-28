"use client";

import ProductCheckoutForm from "@/components/ProductCheckoutForm"; // Laraskan path borang anda
import Link from "next/link";
import { useCart } from "../context/CartContext"; // Laraskan path ke CartContext

export default function CartPage() {
  const { cart } = useCart();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">Trolley & Semakan Pesanan</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md shadow-sm border border-brand-cream">
          <p className="text-gray-600 mb-4">Trolley anda masih kosong.</p>
          <Link
            href="/Merchandise"
            className="inline-block bg-brand-gold text-brand-dark font-semibold px-6 py-2 rounded-sm text-sm"
          >
            LIHAT Merchandise
          </Link>
        </div>
      ) : (
        <ProductCheckoutForm />
      )}
    </div>
  );
}