"use client";

import { useState, FormEvent } from "react";

function formatRM(sen: number) {
  return sen === 0 ? "PERCUMA" : `RM${(sen / 100).toFixed(2)}`;
}

export default function ProgramRegistrationForm({
  classId,
  namaKelas,
  yuranSen,
}: {
  classId: string;
  namaKelas: string;
  yuranSen: number;
}) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState("");

  function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormData(new FormData(e.currentTarget));
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!formData) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/classes/register", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Gagal mendaftar. Sila cuba lagi.");
        setLoading(false);
      }
    } catch (err) {
      setError("Ralat berlaku. Sila cuba lagi.");
      setLoading(false);
    }
  }

  if (step === "confirm" && formData) {
    return (
      <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Sahkan Pendaftaran</h3>
        <div className="text-sm space-y-1 border-b border-brand-cream pb-4">
          <p><strong>Kelas:</strong> {namaKelas}</p>
          <p><strong>Nama:</strong> {String(formData.get("namaPeserta"))}</p>
          <p><strong>Telefon:</strong> {String(formData.get("telefon"))}</p>
          <p><strong>E-mel:</strong> {String(formData.get("emel"))}</p>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Yuran</span>
          <span className="text-brand-gold">{formatRM(yuranSen)}</span>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={loading}
            className="flex-1 border border-brand-dark/20 font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            KEMBALI
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : yuranSen === 0 ? "SAHKAN DAFTAR" : "SAHKAN & BAYAR"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="space-y-3 bg-white p-5 rounded-md shadow-sm">
      <input type="hidden" name="classId" value={classId} />
      <div>
        <label className="block text-xs font-semibold mb-1">Nama Penuh</label>
        <input name="namaPeserta" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">No Telefon</label>
        <input name="telefon" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">E-mel</label>
        <input type="email" name="emel" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <button type="submit" className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full">
        DAFTAR SEKARANG
      </button>
    </form>
  );
}
