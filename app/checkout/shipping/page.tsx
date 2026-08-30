"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCheckout } from "@/app/context/CheckoutContext";
import CheckoutSteps from "@/components/CheckoutSteps";

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default function CheckoutShippingPage() {
  const { quote, address } = useCheckout();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && !quote) router.replace("/checkout/information");
  }, [ready, quote, router]);

  if (!quote || !address) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <CheckoutSteps current="shipping" />
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">Penghantaran</h1>

      <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
        <div className="text-sm">
          <p className="font-semibold text-brand-dark mb-1">Hantar ke:</p>
          <p className="text-brand-dark/70">
            {address.alamat}, {address.poskod} {address.bandar}, {address.negeri}
          </p>
        </div>

        <div className="border-t border-brand-cream pt-4">
          <p className="font-semibold text-brand-dark mb-2">Kaedah Penghantaran</p>
          <div className="flex items-center justify-between bg-brand-cream/60 rounded-sm p-3">
            <span className="text-sm text-brand-dark">
              {quote.courierName || "Kurier Standard"}
            </span>
            <span className="font-semibold text-sm">{formatRM(quote.shippingSen)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/checkout/information"
            className="flex-1 border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm text-center"
          >
            KEMBALI
          </Link>
          <button
            type="button"
            onClick={() => router.push("/checkout/payment")}
            className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm"
          >
            TERUSKAN KE PEMBAYARAN
          </button>
        </div>
      </div>
    </div>
  );
}
