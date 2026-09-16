"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";
import { GERAN_CARD, GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";

const CARD = GERAN_CARD;
const INPUT = GERAN_INPUT;
const LABEL = GERAN_LABEL;
const BTN_PRIMARY = GERAN_BTN_PRIMARY;

export default function LoginJualTanahForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/geran/jual";

  const [step, setStep] = useState<"daftar" | "otp">("daftar");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function requestOtp() {
    setError("");
    setInfo("");
    const res = await fetch("/api/sellers/login-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal hantar kod");
    setMaskedEmail(data.maskedEmail);
  }

  async function handleDaftarSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOtp();
      setCode("");
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setInfo("");
    try {
      await requestOtp();
      setInfo("Kod baharu telah dihantar.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResending(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sellers/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sahkan kod");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#F6F4EE] min-h-screen text-[#0E3B2E]">
      <GeranBrandHeader back={<BackButton href="/geran" label="Direktori" variant="light" />} />

      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-sm text-[#0E3B2E]/55 mb-6">Daftar akaun ringkas untuk senaraikan tanah anda di Geran.</p>
        <div className={CARD}>
          {step === "daftar" ? (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">DAFTAR / LOG MASUK</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                Isi maklumat anda di bawah. Kod pengesahan 6-digit akan dihantar ke e-mel yang didaftarkan
                (ahli sedia ada boleh guna borang sama untuk log masuk semula).
              </p>

              <form onSubmit={handleDaftarSubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Nama Penuh</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Ahmad bin Ali" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>No. Telefon</label>
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 0123456789" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>E-mel</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@emel.com" className={INPUT} />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "MENGHANTAR KOD..." : "HANTAR KOD"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">SAHKAN KOD</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                Kod 6-digit telah dihantar ke <strong>{maskedEmail}</strong>. Sah selama 10 minit.
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Kod Pengesahan</label>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className={`${INPUT} text-center text-2xl font-bold tracking-[0.4em]`}
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}
                {info && <p className="text-emerald-600 text-sm">{info}</p>}

                <button type="submit" disabled={loading || code.length !== 6} className={BTN_PRIMARY}>
                  {loading ? "MENYAHKAN..." : "SAHKAN & LOG MASUK"}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4 text-xs text-[#0E3B2E]/50">
                <button
                  type="button"
                  onClick={() => {
                    setStep("daftar");
                    setError("");
                    setInfo("");
                  }}
                  className="underline hover:text-[#0E3B2E]"
                >
                  ‹ Tukar maklumat
                </button>
                <button type="button" onClick={handleResend} disabled={resending} className="underline hover:text-[#0E3B2E] disabled:opacity-50">
                  {resending ? "Menghantar..." : "Hantar semula kod"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <GeranFooter />
    </div>
  );
}
