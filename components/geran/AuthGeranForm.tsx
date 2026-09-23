"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";
import TurnstileWidget from "@/components/geran/TurnstileWidget";
import { GERAN_CARD, GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";
import { AYAT_SYARAT_KATA_LALUAN, KATA_LALUAN_MIN } from "@/lib/sellerPassword";

const CARD = GERAN_CARD;
const INPUT = GERAN_INPUT;
const LABEL = GERAN_LABEL;
const BTN_PRIMARY = GERAN_BTN_PRIMARY;

// Satu halaman, empat langkah:
//   log-masuk   - emel + kata laluan
//   daftar      - butiran + kata laluan + persetujuan PDPA
//   sah-emel    - kod 6 digit selepas daftar
//   set-kata-laluan - kod 6 digit + kata laluan baharu (lupa / akaun lama)
type Langkah = "log-masuk" | "daftar" | "sah-emel" | "set-kata-laluan";

export default function AuthGeranForm({ modAwal }: { modAwal: "log-masuk" | "daftar" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/geran";

  const [langkah, setLangkah] = useState<Langkah>(modAwal);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kataLaluanBaharu, setKataLaluanBaharu] = useState("");
  const [persetujuanPdpa, setPersetujuanPdpa] = useState(false);
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function reset(ke: Langkah) {
    setLangkah(ke);
    setError("");
    setInfo("");
    setCode("");
  }

  function selesai() {
    router.push(redirectTo);
    router.refresh();
  }

  async function hantar(url: string, payload: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Something went wrong") as Error & { kod?: string };
      err.kod = data.kod;
      throw err;
    }
    return data;
  }

  async function handleLogMasuk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await hantar("/api/sellers/log-masuk", { email, password, turnstileToken });
      selesai();
    } catch (err) {
      const e2 = err as Error & { kod?: string };
      if (e2.kod === "PERLU_SET_KATA_LALUAN") {
        setError("");
        setInfo(e2.message);
        await mintaKodSetKataLaluan();
        return;
      }
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDaftar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await hantar("/api/sellers/daftar", {
        fullName,
        phone,
        email,
        password,
        persetujuanPdpa,
        turnstileToken,
      });
      setMaskedEmail(data.maskedEmail);
      reset("sah-emel");
    } catch (err) {
      const e2 = err as Error & { kod?: string };
      setError(e2.message);
      if (e2.kod === "AKAUN_WUJUD") setLangkah("log-masuk");
    } finally {
      setLoading(false);
    }
  }

  async function handleSahEmel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await hantar("/api/sellers/sah-emel", { email, code });
      selesai();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function mintaKodSetKataLaluan() {
    setError("");
    setLoading(true);
    try {
      if (!email) throw new Error("Please enter your email first.");
      const data = await hantar("/api/sellers/lupa-kata-laluan", { email, turnstileToken });
      setMaskedEmail(data.maskedEmail);
      setCode("");
      setKataLaluanBaharu("");
      setLangkah("set-kata-laluan");
      setInfo(`A code has been sent to ${data.maskedEmail}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetKataLaluan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await hantar("/api/sellers/set-kata-laluan", { email, code, password: kataLaluanBaharu });
      selesai();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tabKelas = (aktif: boolean) =>
    `flex-1 py-2.5 text-sm font-bold rounded-full transition-colors ${
      aktif ? "bg-[#0E3B2E] text-white" : "text-[#0E3B2E]/55 hover:text-[#0E3B2E]"
    }`;

  return (
    <div className="bg-[#F6F4EE] min-h-screen text-[#0E3B2E]">
      <GeranBrandHeader back={<BackButton href="/geran" label="Directory" variant="light" />} />

      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-sm text-[#0E3B2E]/55 mb-6">
          One free account to save land to your favorites, follow up with GT, and list land of your own.
        </p>

        {(langkah === "log-masuk" || langkah === "daftar") && (
          <div className="flex gap-1 bg-black/[0.05] rounded-full p-1 mb-5">
            <button type="button" onClick={() => reset("log-masuk")} className={tabKelas(langkah === "log-masuk")}>
              Log In
            </button>
            <button type="button" onClick={() => reset("daftar")} className={tabKelas(langkah === "daftar")}>
              Sign Up
            </button>
          </div>
        )}

        <div className={CARD}>
          {langkah === "log-masuk" && (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">LOG IN</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">Enter the email and password you signed up with.</p>

              <form onSubmit={handleLogMasuk} className="space-y-4">
                <div>
                  <label className={LABEL}>Email</label>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Password</label>
                  <PasswordInput
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT}
                  />
                </div>

                <TurnstileWidget onToken={setTurnstileToken} />

                {error && <p className="text-red-600 text-sm">{error}</p>}
                {info && <p className="text-emerald-600 text-sm">{info}</p>}

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "LOGGING IN..." : "LOG IN"}
                </button>
              </form>

              <button
                type="button"
                onClick={mintaKodSetKataLaluan}
                disabled={loading}
                className="mt-4 text-xs underline text-[#0E3B2E]/50 hover:text-[#0E3B2E] disabled:opacity-50"
              >
                Forgot your password?
              </button>
            </>
          )}

          {langkah === "daftar" && (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">SIGN UP</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                Create your account, then confirm your email with a 6-digit code.
              </p>

              <form onSubmit={handleDaftar} className="space-y-4">
                <div>
                  <label className={LABEL}>Full Name</label>
                  <input
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ahmad bin Ali"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Phone No.</label>
                  <input
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0123456789"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Password</label>
                  <PasswordInput
                    required
                    autoComplete="new-password"
                    minLength={KATA_LALUAN_MIN}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT}
                  />
                  <p className="text-xs text-[#0E3B2E]/45 mt-1">{AYAT_SYARAT_KATA_LALUAN}</p>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#0E3B2E]/60 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={persetujuanPdpa}
                    onChange={(e) => setPersetujuanPdpa(e.target.checked)}
                    className="mt-0.5 shrink-0"
                  />
                  <span>
                    I have read the{" "}
                    <Link href="/geran/privasi" target="_blank" className="underline hover:text-[#0E3B2E]">
                      privacy notice
                    </Link>{" "}
                    and consent to GT collecting and processing my personal data as described there.
                  </span>
                </label>

                <TurnstileWidget onToken={setTurnstileToken} />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" disabled={loading || !persetujuanPdpa} className={BTN_PRIMARY}>
                  {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </button>
              </form>
            </>
          )}

          {langkah === "sah-emel" && (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">CONFIRM YOUR EMAIL</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                A 6-digit code has been sent to <strong>{maskedEmail}</strong>. Valid for 10 minutes. Your
                account is created once the code is confirmed.
              </p>

              <form onSubmit={handleSahEmel} className="space-y-4">
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

                <button type="submit" disabled={loading || code.length !== 6} className={BTN_PRIMARY}>
                  {loading ? "CONFIRMING..." : "CONFIRM & LOG IN"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => reset("daftar")}
                className="mt-4 text-xs underline text-[#0E3B2E]/50 hover:text-[#0E3B2E]"
              >
                ‹ Change details
              </button>
            </>
          )}

          {langkah === "set-kata-laluan" && (
            <>
              <h2 className="text-[#0E3B2E] font-bold mb-1">SET A NEW PASSWORD</h2>
              <p className="text-[#0E3B2E]/60 text-sm mb-5">
                If an account exists for <strong>{maskedEmail}</strong>, a 6-digit code has been sent to it.
                Valid for 10 minutes.
              </p>

              <form onSubmit={handleSetKataLaluan} className="space-y-4">
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
                <div>
                  <label className={LABEL}>New Password</label>
                  <PasswordInput
                    required
                    autoComplete="new-password"
                    minLength={KATA_LALUAN_MIN}
                    value={kataLaluanBaharu}
                    onChange={(e) => setKataLaluanBaharu(e.target.value)}
                    className={INPUT}
                  />
                  <p className="text-xs text-[#0E3B2E]/45 mt-1">{AYAT_SYARAT_KATA_LALUAN}</p>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}
                {info && <p className="text-emerald-600 text-sm">{info}</p>}

                <button type="submit" disabled={loading || code.length !== 6} className={BTN_PRIMARY}>
                  {loading ? "SAVING..." : "SAVE & LOG IN"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => reset("log-masuk")}
                className="mt-4 text-xs underline text-[#0E3B2E]/50 hover:text-[#0E3B2E]"
              >
                ‹ Back to log in
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-[#0E3B2E]/40 mt-5 leading-relaxed">
          We collect your name, phone number and email to run your account. Read the{" "}
          <Link href="/geran/privasi" className="underline hover:text-[#0E3B2E]">
            privacy notice
          </Link>{" "}
          to see exactly what is kept and for how long.
        </p>
      </div>

      <GeranFooter />
    </div>
  );
}
