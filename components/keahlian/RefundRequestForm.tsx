"use client";

import { useState, FormEvent } from "react";

type Props = {
  fullName: string;
  icNumber: string;
  alreadyRequested: boolean;
  refunded: boolean;
};

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
      <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
        <p className="text-brand-gold font-bold text-sm mb-1">Refund Telah Diproses</p>
        <p className="text-white/60 text-sm">
          Yuran pendaftaran anda telah dipulangkan. Terima kasih atas kesabaran anda.
        </p>
      </div>
    );
  }

  if (submitted || alreadyRequested) {
    return (
      <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
        <p className="text-brand-gold font-bold text-sm mb-1">Permohonan Refund Diterima</p>
        <p className="text-white/60 text-sm">
          Butiran bank anda telah direkodkan. Pihak PLT akan proses pemulangan yuran dalam masa
          terdekat.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
      <p className="text-brand-gold font-bold text-sm mb-1">Mohon Refund Yuran Pendaftaran</p>
      <p className="text-white/60 text-sm mb-5">
        Pendaftaran anda tidak dapat diteruskan. Sila isi butiran bank di bawah untuk pihak PLT
        pulangkan semula yuran yang telah dibayar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-white/80">Nama Bank</label>
          <input
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Contoh: Maybank"
            className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-white/80">No. Akaun Bank</label>
          <input
            required
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder="Contoh: 1234567890"
            className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-white/80">Nama Pemegang Akaun</label>
          <input
            required
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Sama seperti nama dalam bank"
            className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
        >
          {loading ? "MENGHANTAR..." : "HANTAR PERMOHONAN REFUND"}
        </button>
      </form>
    </div>
  );
}
