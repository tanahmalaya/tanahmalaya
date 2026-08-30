"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import CheckoutSteps from "@/components/CheckoutSteps";

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useCart();
  const router = useRouter();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
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
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-brand-cream pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                  <p className="text-xs text-brand-dark/60">RM{item.price.toFixed(2)} / unit</p>
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
                  RM{(item.price * item.quantity).toFixed(2)}
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
    </div>
  );
}
