"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useCheckout } from "@/app/context/CheckoutContext";
import CheckoutSteps from "@/components/CheckoutSteps";

const NEGERI_LIST = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya",
];

export default function CheckoutInformationPage() {
  const { cart } = useCart();
  const { contact, address, setInformation } = useCheckout();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Bagi CartContext masa muatkan dari localStorage dulu sebelum kita
    // redirect (elak "troli kosong" palsu sebaik refresh halaman ni).
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && cart.length === 0) router.replace("/cart");
  }, [ready, cart, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const contactData = {
      namaPembeli: String(fd.get("namaPembeli") || ""),
      telefon: String(fd.get("telefon") || ""),
      emel: String(fd.get("emel") || ""),
    };
    const addressData = {
      alamat: String(fd.get("alamat") || ""),
      poskod: String(fd.get("poskod") || ""),
      bandar: String(fd.get("bandar") || ""),
      negeri: String(fd.get("negeri") || ""),
    };

    try {
      const res = await fetch("/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.productId, kuantiti: item.quantity, saiz: item.saiz })),
          poskod: addressData.poskod,
          negeri: addressData.negeri,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal kira harga penghantaran");

      setInformation(contactData, addressData, data);
      router.push("/checkout/shipping");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <CheckoutSteps current="information" />
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">Maklumat</h1>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-md shadow-sm">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Penuh</label>
          <input
            name="namaPembeli"
            required
            defaultValue={contact?.namaPembeli}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">No Telefon</label>
          <input
            name="telefon"
            required
            defaultValue={contact?.telefon}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">E-mel</label>
          <input
            type="email"
            name="emel"
            required
            defaultValue={contact?.emel}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>

        <div className="border-t border-brand-cream pt-3 mt-3">
          <p className="text-xs font-semibold mb-2">Alamat Penghantaran</p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Alamat</label>
          <textarea
            name="alamat"
            required
            defaultValue={address?.alamat}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Poskod</label>
            <input
              name="poskod"
              required
              pattern="[0-9]{5}"
              defaultValue={address?.poskod}
              className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Bandar</label>
            <input
              name="bandar"
              required
              defaultValue={address?.bandar}
              className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Negeri</label>
          <select
            name="negeri"
            required
            defaultValue={address?.negeri ?? ""}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          >
            <option value="">Pilih negeri</option>
            {NEGERI_LIST.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link
            href="/cart"
            className="flex-1 border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm text-center"
          >
            KEMBALI
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            {loading ? "MENGIRA..." : "TERUSKAN KE PENGHANTARAN"}
          </button>
        </div>
      </form>
    </div>
  );
}
