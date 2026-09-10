"use client";

import { FormEvent, useState } from "react";
import ResitUpload from "@/components/petty-cash/ResitUpload";

type Kategori = "PENGANGKUTAN" | "ALAT_TULIS" | "PROGRAM_AKTIVITI" | "LAIN_LAIN";
type ClaimStatus = "MENUNGGU" | "DILULUSKAN" | "DITOLAK" | "DIBAYAR";

const KATEGORI_LABEL: Record<Kategori, string> = {
  PENGANGKUTAN: "Pengangkutan",
  ALAT_TULIS: "Alat Tulis",
  PROGRAM_AKTIVITI: "Program / Aktiviti",
  LAIN_LAIN: "Lain-lain",
};

const STATUS_LABEL: Record<ClaimStatus, string> = {
  MENUNGGU: "Menunggu",
  DILULUSKAN: "Diluluskan",
  DITOLAK: "Ditolak",
  DIBAYAR: "Dibayar",
};

const STATUS_BADGE: Record<ClaimStatus, string> = {
  MENUNGGU: "bg-amber-50 text-amber-700 border border-amber-200",
  DILULUSKAN: "bg-blue-50 text-blue-700 border border-blue-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
  DIBAYAR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const CARD = "bg-white border border-black/5 border-l-4 border-l-emerald-500/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
const INPUT = "w-full bg-[#F7F5F1] border border-black/10 rounded-xl p-3 text-sm text-brand-dark placeholder-black/30 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 outline-none transition";
const LABEL = "block text-xs font-semibold mb-1.5 text-brand-dark/70";
const BTN_PRIMARY = "w-full bg-brand-gold text-brand-dark font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-sm shadow-brand-gold/30 hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-sm";

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type ClaimHistoryItem = {
  id: string;
  seq: number;
  jumlahSen: number;
  kategori: Kategori;
  tujuan: string;
  tarikhPerbelanjaan: string;
  status: ClaimStatus;
  catatanAdmin: string | null;
  createdAt: string;
};

export default function BorangClaimForm({
  memberNo,
  savedBankName,
  savedAccountNo,
  savedAccountHolder,
  initialHistory,
}: {
  memberNo: string;
  savedBankName: string | null;
  savedAccountNo: string | null;
  savedAccountHolder: string | null;
  initialHistory: ClaimHistoryItem[];
}) {
  const [jumlahRM, setJumlahRM] = useState("");
  const [kategori, setKategori] = useState<Kategori>("LAIN_LAIN");
  const [tujuan, setTujuan] = useState("");
  const [tarikhPerbelanjaan, setTarikhPerbelanjaan] = useState(() => new Date().toISOString().slice(0, 10));
  const [resitUrl, setResitUrl] = useState<string | null>(null);
  const [bankName, setBankName] = useState(savedBankName || "");
  const [accountNo, setAccountNo] = useState(savedAccountNo || "");
  const [accountHolder, setAccountHolder] = useState(savedAccountHolder || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [justSubmittedSeq, setJustSubmittedSeq] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setJustSubmittedSeq(null);
    setLoading(true);
    try {
      const res = await fetch("/api/petty-cash/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlahRM: Number(jumlahRM),
          kategori,
          tujuan,
          tarikhPerbelanjaan,
          resitUrl,
          bankName,
          accountNo,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal hantar tuntutan");

      setJustSubmittedSeq(data.seq);
      setHistory((prev) => [
        {
          id: data.id,
          seq: data.seq,
          jumlahSen: Math.round(Number(jumlahRM) * 100),
          kategori,
          tujuan,
          tarikhPerbelanjaan,
          status: "MENUNGGU",
          catatanAdmin: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setJumlahRM("");
      setTujuan("");
      setResitUrl(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={CARD}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-brand-gold font-bold">BORANG TUNTUTAN BARU</h2>
          <span className="text-xs text-brand-dark/50">No. Ahli: {memberNo}</span>
        </div>
        <p className="text-brand-dark/60 text-sm mb-5">
          Isi butiran perbelanjaan di bawah. Muat naik resit adalah pilihan (tidak wajib untuk perbelanjaan berkaitan kerja).
        </p>

        {justSubmittedSeq !== null && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
            Tuntutan #{justSubmittedSeq} berjaya dihantar. Status: Menunggu semakan PLT.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Jumlah Tuntutan (RM)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={jumlahRM}
                onChange={(e) => setJumlahRM(e.target.value)}
                placeholder="Contoh: 45.50"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value as Kategori)} className={INPUT}>
                {(Object.keys(KATEGORI_LABEL) as Kategori[]).map((k) => (
                  <option key={k} value={k}>
                    {KATEGORI_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Tujuan / Kegunaan Perbelanjaan</label>
            <textarea
              required
              rows={3}
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="Contoh: Tambang teksi ke lokasi program Kelas Asas Tanah, 12 Sept 2026"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Tarikh Perbelanjaan</label>
            <input
              type="date"
              required
              value={tarikhPerbelanjaan}
              onChange={(e) => setTarikhPerbelanjaan(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Resit / Bukti Perbelanjaan (pilihan)</label>
            <ResitUpload value={resitUrl} onChange={setResitUrl} />
          </div>

          <div className="border-t border-black/10 pt-4">
            <p className="text-xs font-semibold text-brand-dark/70 mb-3">MAKLUMAT BANK UNTUK BAYARAN BALIK</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Nama Bank</label>
                <input required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Contoh: Maybank" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>No. Akaun</label>
                <input required value={accountNo} onChange={(e) => setAccountNo(e.target.value)} className={INPUT} />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL}>Nama Pemegang Akaun</label>
              <input required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className={INPUT} />
            </div>
            {(savedBankName || savedAccountNo) && (
              <p className="text-xs text-brand-dark/45 mt-2">
                Maklumat bank diisi automatik daripada tuntutan lepas anda — boleh ubah jika perlu.
              </p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className={BTN_PRIMARY}>
            {loading ? "MENGHANTAR..." : "HANTAR TUNTUTAN"}
          </button>
        </form>
      </div>

      <div className={CARD}>
        <h2 className="text-brand-gold font-bold mb-4">SEJARAH TUNTUTAN SAYA</h2>
        {history.length === 0 ? (
          <p className="text-brand-dark/50 text-sm">Belum ada tuntutan dihantar.</p>
        ) : (
          <div className="space-y-3">
            {history.map((c) => (
              <div key={c.id} className="border border-black/10 rounded-xl p-4">
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <div>
                    <p className="font-semibold text-sm">
                      #{c.seq} — {KATEGORI_LABEL[c.kategori]}
                    </p>
                    <p className="text-xs text-brand-dark/50">
                      {new Date(c.tarikhPerbelanjaan).toLocaleDateString("ms-MY")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p className="text-sm text-brand-dark/70 mb-1">{c.tujuan}</p>
                <p className="font-bold text-brand-gold text-sm">{formatRM(c.jumlahSen)}</p>
                {c.status === "DITOLAK" && c.catatanAdmin && (
                  <p className="text-xs text-red-600 mt-1.5">Sebab: {c.catatanAdmin}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
