"use client";

import { useState, FormEvent } from "react";

type Props = {
  fullName: string;
  icNumber: string;
  alreadyRequested: boolean;
  refunded: boolean;
};

const CARD = "bg-white border border-black/5 border-l-4 border-l-emerald-500/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
const INPUT = "w-full bg-[#F7F5F1] border border-black/10 rounded-xl p-3 text-sm text-brand-dark placeholder-black/30 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 outline-none transition";
const LABEL = "block text-xs font-semibold mb-1.5 text-brand-dark/70";

export default function RefundRequestForm({ fullName, icNumber, alreadyRequested, refunded }: Props) {
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/members/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, icNumber, bankName, accountNo, accountHolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal hantar permohonan refund");
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (refunded) {
    return (
      <div className={CARD}>
        <p className="text-brand-gold font-bold text-sm mb-1">Refund Telah Diproses</p>
        <p className="text-brand-dark/60 text-sm">
          Yuran pendaftaran anda telah dipulangkan. Terima kasih atas kesabaran anda.
        </p>
      </div>
    );
  }

  if (submitted || alreadyRequested) {
    return (
      <div className={CARD}>
        <p className="text-brand-gold font-bold text-sm mb-1">Permohonan Refund Diterima</p>
        <p className="text-brand-dark/60 text-sm">
          Butiran bank anda telah direkodkan. Pihak PLT akan proses pemulangan yuran dalam masa
          terdekat.
        </p>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <p className="text-brand-gold font-bold text-sm mb-1">Mohon Refund Yuran Pendaftaran</p>
      <p className="text-brand-dark/60 text-sm mb-5">
        Pendaftaran anda tidak dapat diteruskan. Sila isi butiran bank di bawah untuk pihak PLT
        pulangkan semula yuran yang telah dibayar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Nama Bank</label>
          <input
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Contoh: Maybank"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>No. Akaun Bank</label>
          <input
            required
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder="Contoh: 1234567890"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Nama Pemegang Akaun</label>
          <input
            required
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Sama seperti nama dalam bank"
            className={INPUT}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gold text-brand-dark font-semibold py-3.5 rounded-full shadow-sm shadow-brand-gold/30 hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? "MENGHANTAR..." : "HANTAR PERMOHONAN REFUND"}
        </button>
      </form>
    </div>
  );
}
