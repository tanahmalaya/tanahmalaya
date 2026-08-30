"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  MENUNGGU_BAYARAN: "Menunggu Bayaran",
};

type MemberResult = {
  memberNo: string;
  fullName: string;
  status: string;
  joinedAt: string;
};

export default function SemakKeahlianPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MemberResult | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/members/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          icNumber: fd.get("icNumber"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal semak keahlian");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Semak No Ahli</h1>
      <p className="text-brand-dark/70 mb-8">
        Untuk ahli yang telah berdaftar - masukkan nama penuh dan No Kad Pengenalan
        seperti semasa pendaftaran untuk menyemak nombor ahli dan status keahlian anda.
      </p>

      {result ? (
        <div className="bg-white p-8 rounded-md shadow-sm space-y-4">
          <div className="text-sm space-y-2 border-b border-brand-cream pb-4">
            <p><strong>Nama:</strong> {result.fullName}</p>
            <p><strong>Tarikh Daftar:</strong> {new Date(result.joinedAt).toLocaleDateString("ms-MY")}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Nombor Ahli</span>
            <span className="font-bold text-lg text-brand-gold">{result.memberNo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Status</span>
            <span className="font-semibold">{STATUS_LABEL[result.status] || result.status}</span>
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="w-full border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm"
          >
            SEMAK LAGI
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-md shadow-sm">
          <div>
            <label className="block text-sm font-semibold mb-1">Nama Penuh</label>
            <input name="fullName" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">No Kad Pengenalan (tanpa tanda -)</label>
            <input name="icNumber" required pattern="[0-9]{12}" className="w-full border border-brand-dark/20 rounded-sm p-3" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-50"
          >
            {loading ? "MENYEMAK..." : "SEMAK"}
          </button>
        </form>
      )}

      <p className="text-sm text-brand-dark/60 mt-6">
        Belum berdaftar? <Link href="/keahlian" className="text-brand-gold underline">Daftar sebagai ahli</Link>.
      </p>
    </section>
  );
}
