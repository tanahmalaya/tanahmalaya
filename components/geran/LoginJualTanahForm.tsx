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
    if (!res.ok) throw new Error(data.error || "Failed to send code");
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
      setInfo("A new code has been sent.");
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
      if (!res.ok) throw new Error(data.error || "Failed to verify code");
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
      <GeranBrandHeader back={<BackButton href="/geran" label="Directory" variant="light" />} />

      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-sm text-[#0E3B2E]/55 mb-6">
          One free account to save land to your favorites, follow up with PLT, and list land of your own.
        </p>
        <div className={CARD}>
          {step === "daftar" ? (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">SIGN UP / LOG IN</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                New here? Fill in your details and we will create your account. Already registered? Use
                the same form with the email you signed up with. Either way, a 6-digit code is sent to
                your inbox - no password to remember.
              </p>

              <form onSubmit={handleDaftarSubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Full Name</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ahmad bin Ali" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Phone No.</label>
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0123456789" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className={INPUT} />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "SENDING CODE..." : "SEND CODE"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">VERIFY CODE</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                A 6-digit code has been sent to <strong>{maskedEmail}</strong>. Valid for 10 minutes.
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Verification Code</label>
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
                  {loading ? "VERIFYING..." : "VERIFY & LOG IN"}
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
                  ‹ Change details
                </button>
                <button type="button" onClick={handleResend} disabled={resending} className="underline hover:text-[#0E3B2E] disabled:opacity-50">
                  {resending ? "Sending..." : "Resend code"}
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
