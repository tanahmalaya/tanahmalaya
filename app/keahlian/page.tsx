"use client";

import { useState, FormEvent } from "react";

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default function MembershipPage() {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [yuranSen, setYuranSen] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/settings/yuran");
      const data = await res.json();
      setYuranSen(data.yuranSen);
      setFormData(fd);
      setStep("confirm");
    } catch (err) {
      setError("Gagal memuatkan maklumat yuran. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!formData) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Gagal mendapatkan pautan pembayaran. Sila cuba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Ralat berlaku semasa pendaftaran.");
      setLoading(false);
    }
  }

  if (step === "confirm" && formData && yuranSen !== null) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold mb-2">Sahkan Pendaftaran</h1>
        <p className="text-brand-dark/70 mb-8">
          Sila semak maklumat Tuan sebelum diteruskan ke bayaran BayarCash.
        </p>

        <div className="bg-white p-8 rounded-md shadow-sm space-y-4">
          <div className="text-sm space-y-2 border-b border-brand-cream pb-4">
            <p><strong>Nama Penuh:</strong> {String(formData.get("fullName"))}</p>
            <p><strong>No Kad Pengenalan:</strong> {String(formData.get("icNumber"))}</p>
            <p><strong>No Telefon:</strong> {String(formData.get("phone"))}</p>
            <p><strong>E-mel:</strong> {String(formData.get("email"))}</p>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Yuran Membership</span>
            <span className="text-brand-gold">{formatRM(yuranSen)}</span>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={loading}
              className="flex-1 border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
            >
              KEMBALI
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
            >
              {loading ? "Memproses..." : "SAHKAN & BAYAR"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Borang Membership</h1>
      <p className="text-brand-dark/70 mb-8">
        Sertai Pertubuhan Literasi Tanah dan nikmati akses kepada kelas eksklusif,
        bahan pembelajaran, dan Aktiviti komuniti. Yuran Membership akan diproses
        melalui BayarCash.
      </p>

      <form onSubmit={handleReview} className="space-y-5 bg-white p-8 rounded-md shadow-sm">
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-50"
        >
          {loading ? "MEMUATKAN..." : "SEMAK PENDAFTARAN"}
        </button>
      </form>
    </section>
  );
}
