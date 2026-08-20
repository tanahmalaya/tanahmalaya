"use client";

import { useState, FormEvent } from "react";

const NEGERI_LIST = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya",
];

export default function ProductCheckoutForm({ productId, stok }: { productId: string; stok: number }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Gagal mendapatkan pautan pembayaran. Sila cuba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Ralat berlaku semasa pemprosesan. Sila cuba lagi.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-md shadow-sm">
      <input type="hidden" name="productId" value={productId} />
      <div>
        <label className="block text-xs font-semibold mb-1">Kuantiti</label>
        <input
          type="number"
          name="kuantiti"
          min={1}
          max={stok}
          defaultValue={1}
          required
          className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Nama Penuh</label>
        <input name="namaPembeli" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">No Telefon</label>
        <input name="telefon" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">E-mel</label>
        <input type="email" name="emel" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div className="border-t border-brand-cream pt-3 mt-3">
        <p className="text-xs font-semibold mb-2">Alamat Penghantaran</p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Alamat</label>
        <textarea name="alamat" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Poskod</label>
          <input name="poskod" required pattern="[0-9]{5}" className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Bandar</label>
          <input name="bandar" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Negeri</label>
        <select name="negeri" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm">
          <option value="">Pilih negeri</option>
          {NEGERI_LIST.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-50"
      >
        {loading ? "MENGIKAT PAUTAN BAYARAN..." : "BELI SEKARANG"}
      </button>
    </form>
  );
}