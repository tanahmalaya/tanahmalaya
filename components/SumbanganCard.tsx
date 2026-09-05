"use client";

import { useState } from "react";

const PRESET_RM = [10, 20, 50, 100];

function formatRM(sen: number) {
  return `RM${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SumbanganCard({ title = "Sumbangan Ikhlas" }: { title?: string }) {
  const [amountRM, setAmountRM] = useState("");
  const [namaPenderma, setNamaPenderma] = useState("");
  const [emel, setEmel] = useState("");
  const [telefon, setTelefon] = useState("");
  const [loading, setLoading] = useState(false);
  const [ralat, setRalat] = useState("");

  const amountSen = Math.round((parseFloat(amountRM) || 0) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");

    if (amountSen < 500) {
      setRalat("Jumlah sumbangan minimum RM5.00.");
      return;
    }
    if (!namaPenderma.trim() || !emel.trim() || !telefon.trim()) {
      setRalat("Sila lengkapkan nama, e-mel & no. telefon untuk resit sumbangan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sumbangan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPenderma, emel, telefon, amountSen }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setRalat(json.error || "Gagal mendapatkan pautan pembayaran. Sila cuba lagi.");
        setLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setRalat("Ralat rangkaian. Sila cuba lagi.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm p-6 space-y-5">
      <div>
        <h3 className="font-display font-bold text-lg mb-1">💛 {title}</h3>
        <p className="text-xs text-brand-dark/60">
          Sumbangan anda membantu kelangsungan program pendidikan &amp; advokasi literasi tanah PLT.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Jumlah Sumbangan</label>
        <div className="flex items-center gap-2 bg-brand-cream rounded-md px-4 py-3">
          <span className="text-brand-dark/60 font-semibold">RM</span>
          <input
            type="number"
            inputMode="decimal"
            min="5"
            step="1"
            value={amountRM}
            onChange={(e) => setAmountRM(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-bold text-brand-dark outline-none w-full"
          />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {PRESET_RM.map((rm) => (
            <button
              key={rm}
              type="button"
              onClick={() => setAmountRM(String(rm))}
              className={`border rounded-sm py-2 text-sm font-semibold transition-colors ${
                Number(amountRM) === rm
                  ? "border-brand-gold bg-brand-gold/10 text-brand-dark"
                  : "border-brand-dark/20 text-brand-dark/70 hover:border-brand-gold"
              }`}
            >
              RM{rm}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1">Nama Penderma</label>
          <input
            value={namaPenderma}
            onChange={(e) => setNamaPenderma(e.target.value)}
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">E-mel</label>
          <input
            type="email"
            value={emel}
            onChange={(e) => setEmel(e.target.value)}
            placeholder="Untuk resit sumbangan"
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">No. Telefon</label>
          <input
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="012-3456789"
            className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-brand-cream pt-4">
        <span className="text-sm font-semibold text-brand-dark/70">Jumlah Sumbangan</span>
        <span className="text-lg font-bold text-brand-gold">{formatRM(amountSen)}</span>
      </div>

      {ralat && <p className="text-sm text-red-600">{ralat}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-60"
      >
        {loading ? "Memproses..." : "DONATE NOW"}
      </button>
      <p className="text-[11px] text-center text-brand-dark/40">
        Anda akan dibawa ke halaman pembayaran selamat BayarCash (FPX / Online Banking).
      </p>
    </form>
  );
}
