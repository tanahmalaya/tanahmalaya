"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconUserCircle, IconSearch, IconShieldCheck } from "@/components/keahlian/icons";
import BackButton from "@/components/BackButton";

const CARD = "bg-white border border-black/5 border-l-4 border-l-emerald-500/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
const INPUT = "w-full bg-[#F7F5F1] border border-black/10 rounded-xl p-3 text-sm text-brand-dark placeholder-black/30 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 outline-none transition";
const LABEL = "block text-xs font-semibold mb-1.5 text-brand-dark/70";
const BTN_PRIMARY = "w-full bg-brand-gold text-brand-dark font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-sm shadow-brand-gold/30 hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-sm";

export default function LoginAhliPltForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/borang-claim";

  const [step, setStep] = useState<"identify" | "otp">("identify");
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function requestOtp() {
    setError("");
    setInfo("");
    const res = await fetch("/api/members/login-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, icNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal hantar kod");
    setMaskedEmail(data.maskedEmail);
  }

  async function handleIdentifySubmit(e: FormEvent<HTMLFormElement>) {
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
      const res = await fetch("/api/members/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, icNumber, code }),
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
    <div className="bg-white text-brand-dark">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#FBF9F6] to-white border-b border-black/5">
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,138,46,0.16) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="max-w-lg mx-auto px-6 py-10 flex items-center gap-5 relative">
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-brand-gold/40">
            <Image src="/logo.png" width={64} height={64} alt="Pertubuhan Literasi Tanah" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide">MEMBER ONLY</h1>
            <p className="text-brand-dark/60 text-sm mt-1">
              Claim, Program &amp; Kelas dan Peta hanya untuk Ahli PLT aktif.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-3">
        <BackButton href="/keahlian" label="Kembali" />
      </div>

      <div className="max-w-lg mx-auto px-6 pb-16">
        <div className={CARD}>
          {step === "identify" ? (
            <>
              <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
                <IconUserCircle />
                <span>LOG MASUK</span>
              </div>
              <p className="text-brand-dark/60 text-sm mb-5">
                Masukkan nama penuh dan No. Kad Pengenalan seperti didaftarkan. Kod pengesahan akan dihantar ke e-mel berdaftar anda.
              </p>

              <form onSubmit={handleIdentifySubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Nama Penuh</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Ahmad bin Ali"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>No. Kad Pengenalan (tanpa tanda -)</label>
                  <input
                    required
                    pattern="[0-9]{12}"
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="Contoh: 900101011234"
                    className={INPUT}
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  <IconSearch />
                  {loading ? "MENGHANTAR KOD..." : "HANTAR KOD"}
                </button>
              </form>

              <p className="text-xs text-brand-dark/50 mt-4">
                Bukan Ahli PLT? <Link href="/keahlian" className="text-brand-gold underline">Lihat maklumat keahlian</Link>.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
                <IconShieldCheck />
                <span>SAHKAN KOD</span>
              </div>
              <p className="text-brand-dark/60 text-sm mb-5">
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

              <div className="flex items-center justify-between mt-4 text-xs text-brand-dark/50">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identify");
                    setError("");
                    setInfo("");
                  }}
                  className="underline hover:text-brand-dark"
                >
                  ‹ Tukar nama / No. KP
                </button>
                <button type="button" onClick={handleResend} disabled={resending} className="underline hover:text-brand-dark disabled:opacity-50">
                  {resending ? "Menghantar..." : "Hantar semula kod"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
