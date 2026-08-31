"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useCheckout } from "@/app/context/CheckoutContext";
import CheckoutSteps from "@/components/CheckoutSteps";

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default function CheckoutPaymentPage() {
  const { cart, clearCart } = useCart();
  const { contact, address, quote, resetCheckout } = useCheckout();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && (!quote || !contact || !address)) router.replace("/checkout/information");
  }, [ready, quote, contact, address, router]);

  if (!quote || !contact || !address) return null;

  async function handlePay() {
    setError("");
    if (!agree) {
      setError("Sila bersetuju dengan Terma Perkhidmatan untuk teruskan.");
      return;
    }
    setLoading(true);

    const payload = new FormData();
    payload.append("namaPembeli", contact!.namaPembeli);
    payload.append("telefon", contact!.telefon);
    payload.append("emel", contact!.emel);
    payload.append("alamat", address!.alamat);
    payload.append("poskod", address!.poskod);
    payload.append("bandar", address!.bandar);
    payload.append("negeri", address!.negeri);
    payload.append("cart", JSON.stringify(cart));

    try {
      const res = await fetch("/api/orders", { method: "POST", body: payload });
      const result = await res.json();
      if (result.url) {
        clearCart();
        resetCheckout();
        window.location.href = result.url;
      } else {
        setError(result.error || "Gagal mendapatkan pautan pembayaran.");
        setLoading(false);
      }
    } catch {
      setError("Ralat berlaku semasa pemprosesan. Sila cuba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <CheckoutSteps current="payment" />
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">Pembayaran</h1>

      <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
        <div className="text-sm space-y-1 border-b border-brand-cream pb-4">
          <p><strong>Nama:</strong> {contact.namaPembeli}</p>
          <p><strong>Telefon:</strong> {contact.telefon}</p>
          <p><strong>E-mel:</strong> {contact.emel}</p>
          <p className="pt-2">
            <strong>Alamat:</strong> {address.alamat}, {address.poskod} {address.bandar}, {address.negeri}
          </p>
        </div>

        <div className="text-sm space-y-2 border-b border-brand-cream pb-4">
          <p className="font-semibold">Barangan Pesanan:</p>
          {quote.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {item.namaProduk} x{item.kuantiti}
                {item.diskaunPercent > 0 && (
                  <span className="text-brand-gold font-semibold"> (-{item.diskaunPercent}%)</span>
                )}
              </span>
              {item.diskaunPercent > 0 ? (
                <span>
                  <span className="text-brand-dark/40 line-through mr-1.5">{formatRM(item.hargaAsalSen)}</span>
                  {formatRM(item.hargaBarangSen)}
                </span>
              ) : (
                <span>{formatRM(item.hargaBarangSen)}</span>
              )}
            </div>
          ))}
          {quote.diskaunSen > 0 && (
            <div className="flex justify-between text-brand-gold font-semibold pt-2 border-t">
              <span>🎉 Jimat (Promo Jaket)</span>
              <span>-{formatRM(quote.diskaunSen)}</span>
            </div>
          )}
          <div className="flex justify-between text-brand-dark/70 pt-2 border-t">
            <span>Penghantaran{quote.courierName ? ` (${quote.courierName})` : ""}</span>
            <span>{formatRM(quote.shippingSen)}</span>
          </div>
        </div>

        <div className="flex justify-between font-bold text-lg">
          <span>Jumlah Keseluruhan</span>
          <span className="text-brand-gold">{formatRM(quote.jumlahSen)}</span>
        </div>

        <label className="flex items-start gap-2 text-xs text-brand-dark/80 pt-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Saya bersetuju dengan{" "}
            <Link href="/terma-perkhidmatan" target="_blank" className="text-brand-gold underline">
              Terma Perkhidmatan
            </Link>{" "}
            PLT.
          </span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link
            href="/checkout/shipping"
            className="flex-1 border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm text-center"
          >
            KEMBALI
          </Link>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading || !agree}
            className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "BAYAR SEKARANG"}
          </button>
        </div>
      </div>
    </div>
  );
}
