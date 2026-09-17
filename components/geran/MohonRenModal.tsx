"use client";

import { FormEvent, useState } from "react";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import { STATUS_GERAN_LABEL } from "@/lib/geran";
import { GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";

type Status = keyof typeof STATUS_GERAN_LABEL;

export type RenStatusInfo = {
  status: Status;
  catatanAdmin: string | null;
} | null;

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

export default function MohonRenModal({
  namaPenjual,
  telefonPenjual,
  initialStatus,
}: {
  namaPenjual: string;
  telefonPenjual: string;
  initialStatus: RenStatusInfo;
}) {
  const [open, setOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState(initialStatus);

  const [namaPenuh, setNamaPenuh] = useState(namaPenjual);
  const [telefon, setTelefon] = useState(telefonPenjual);
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [noRen, setNoRen] = useState("");
  const [akuan, setAkuan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPenuh, telefon, negeri, noRen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal hantar permohonan");

      setStatusInfo({ status: "MENUNGGU_SEMAKAN", catatanAdmin: null });
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (statusInfo) {
    return (
      <div className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-3.5 py-2.5">
        <span className="text-xs font-semibold text-[#0E3B2E]/70">REN Berdaftar PLT:</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[statusInfo.status]}`}>
          {STATUS_GERAN_LABEL[statusInfo.status]}
        </span>
        {statusInfo.status === "DITOLAK" && (
          <button onClick={() => setStatusInfo(null)} className="text-xs underline text-[#0E3B2E]/60 ml-auto">
            Mohon semula
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[#0E3B2E] underline decoration-[#0E3B2E]/30 underline-offset-2"
      >
        🏢 Mohon Jadi REN Berdaftar PLT
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-[#0E3B2E]">Mohon Jadi REN Berdaftar PLT</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#0E3B2E]/40 hover:text-[#0E3B2E] text-lg leading-none"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p className="text-[#0E3B2E]/60 text-sm mb-5">
              REN berdaftar PLT boleh senaraikan tanah terus (tanpa tunggu semakan admin). Isi maklumat diri
              &amp; no. pendaftaran REN anda di bawah.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={GERAN_LABEL}>Nama Penuh</label>
                <input
                  required
                  value={namaPenuh}
                  onChange={(e) => setNamaPenuh(e.target.value)}
                  className={GERAN_INPUT}
                />
              </div>

              <div>
                <label className={GERAN_LABEL}>No. Telefon</label>
                <input
                  required
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className={GERAN_INPUT}
                />
              </div>

              <div>
                <label className={GERAN_LABEL}>Negeri Berkhidmat</label>
                <select value={negeri} onChange={(e) => setNegeri(e.target.value)} className={GERAN_INPUT}>
                  {NEGERI_LIST.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={GERAN_LABEL}>No. Pendaftaran REN</label>
                <input
                  required
                  value={noRen}
                  onChange={(e) => setNoRen(e.target.value)}
                  placeholder="Contoh: REN 12345"
                  className={GERAN_INPUT}
                />
              </div>

              <label className="flex items-start gap-3 bg-[#F7F5F1] rounded-xl p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={akuan}
                  onChange={(e) => setAkuan(e.target.checked)}
                  required
                  className="mt-0.5"
                />
                <span className="text-sm text-[#0E3B2E]/80">
                  Saya sahkan no. pendaftaran REN ini sah &amp; didaftarkan dengan LPPEH. Maklumat palsu boleh
                  menyebabkan akaun digantung.
                </span>
              </label>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <span>ℹ️</span>
                <span>
                  <span className="font-semibold">Apa akan berlaku seterusnya?</span> Admin PLT akan sahkan no.
                  pendaftaran REN anda. Selepas diluluskan, penyenaraian tanah anda akan disahkan automatik.
                </span>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-black/10 text-[#0E3B2E] font-semibold py-3 rounded-full"
                >
                  Batal
                </button>
                <button type="submit" disabled={loading || !akuan} className={`flex-1 ${GERAN_BTN_PRIMARY}`}>
                  {loading ? "MENGHANTAR..." : "Hantar Permohonan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
