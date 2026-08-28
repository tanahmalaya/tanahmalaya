"use client";

import { useState, FormEvent } from "react";

export default function MembershipPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Elak borang submit secara POST tradisional
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.url) {
        // Redirect terus ke URL BayarCash melalui Client (GET request)
        window.location.href = result.url;
      } else {
        alert("Gagal mendapatkan pautan pembayaran. Sila cuba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Ralat berlaku semasa pendaftaran.");
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Borang Membership</h1>
      <p className="text-brand-dark/70 mb-8">
        Sertai Pertubuhan Literasi Tanah dan nikmati akses kepada kelas eksklusif,
        bahan pembelajaran, dan Aktiviti komuniti. Yuran Membership akan diproses
        melalui BayarCash.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-md shadow-sm">
        <div>
          <label className="block text-sm font-semibold mb-1">Nama Penuh</label>
          <input name="fullName" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">No Kad Pengenalan (tanpa tanda -)</label>
          <input name="icNumber" required pattern="[0-9]{12}" className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">No Telefon</label>
          <input name="phone" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">E-mel</label>
          <input type="email" name="email" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-50"
        >
          {loading ? "MENGIKAT PAUTAN BAYARAN..." : "DAFTAR & TERUSKAN KE BAYARAN"}
        </button>
      </form>
    </section>
  );
}
