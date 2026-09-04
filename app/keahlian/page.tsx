"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconUserCircle, IconShieldCheck, IconIdCard } from "@/components/keahlian/icons";
import OrgInfoCard from "@/components/keahlian/OrgInfoCard";
import BackButton from "@/components/BackButton";
import { isValidMalaysianIC, getAgeFromIC, MIN_AGE_AHLI_PLT } from "@/lib/ic";

type MemberType = "PLT" | "BERSEKUTU";

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

const TYPE_INFO: Record<MemberType, { title: string; tagline: string; wajib: boolean }> = {
  PLT: {
    title: "Ahli PLT",
    tagline: "Ahli penuh Pertubuhan Literasi Tanah. Yuran tahunan wajib dibayar.",
    wajib: true,
  },
  BERSEKUTU: {
    title: "Ahli Bersekutu",
    tagline: "Sokong PLT sebagai ahli bersekutu dengan yuran minimum.",
    wajib: false,
  },
};

export default function KeahlianPage() {
  const [memberType, setMemberType] = useState<MemberType>("PLT");
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [akuanSelangor, setAkuanSelangor] = useState(false);

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [yuranSen, setYuranSen] = useState<number | null>(null);
  const [error, setError] = useState("");

  function resetFormState(nextType: MemberType) {
    setMemberType(nextType);
    setStep("form");
    setError("");
    setYuranSen(null);
    setAkuanSelangor(false);
  }

  async function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const icCheck = isValidMalaysianIC(icNumber);
    if (!icCheck.valid) {
      setError(icCheck.reason || "No. Kad Pengenalan tidak sah.");
      return;
    }

    if (memberType === "PLT") {
      if (getAgeFromIC(icNumber) < MIN_AGE_AHLI_PLT) {
        setError(`Ahli PLT mesti berumur ${MIN_AGE_AHLI_PLT} tahun ke atas.`);
        return;
      }
      if (!akuanSelangor) {
        setError("Sila tandakan akujanji berdaftar mengundi di Selangor untuk mendaftar sebagai Ahli PLT.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/yuran");
      const data = await res.json();
      setYuranSen(memberType === "PLT" ? data.pltSen : data.bersekutuSen);
      setStep("confirm");
    } catch (err) {
      setError("Gagal memuatkan maklumat yuran. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("icNumber", icNumber);
    fd.set("phone", phone);
    fd.set("email", email);
    fd.set("memberType", memberType);
    fd.set("akuanSelangor", String(akuanSelangor));

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        body: fd,
      });

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Gagal mendapatkan pautan pembayaran. Sila cuba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Ralat berlaku semasa pendaftaran.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-dark text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-brand-gold/30">
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,138,46,0.18) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="max-w-4xl mx-auto px-6 py-10 flex items-center gap-5 relative">
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-brand-gold/40">
            <Image src="/logo.png" width={64} height={64} alt="Pertubuhan Literasi Tanah" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide">BORANG KEAHLIAN</h1>
            <p className="text-white/60 text-sm mt-1 max-w-lg">
              Sertai Pertubuhan Literasi Tanah dan nikmati akses kepada kelas eksklusif, bahan
              pembelajaran, dan aktiviti komuniti.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-2">
        <BackButton href="/" label="Kembali" variant="dark" />
        <div className="text-xs text-white/50 flex items-center gap-2">
          <Link href="/" className="hover:text-white">Utama</Link>
          <span>&rsaquo;</span>
          <span className="text-brand-gold font-semibold">Keahlian</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {/* Pilih jenis keahlian */}
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.keys(TYPE_INFO) as MemberType[]).map((t) => {
            const info = TYPE_INFO[t];
            const active = memberType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => resetFormState(t)}
                className={`text-left rounded-md p-5 border transition ${
                  active
                    ? "bg-brand-gold/10 border-brand-gold"
                    : "bg-white/[0.04] border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-display font-bold text-lg ${active ? "text-brand-gold" : "text-white"}`}>
                    {info.title}
                  </span>
                  {info.wajib && (
                    <span className="text-[10px] uppercase tracking-wide bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-sm font-semibold">
                      Wajib
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-xs">{info.tagline}</p>
              </button>
            );
          })}
        </div>

        {/* Syarat keahlian Ahli PLT */}
        {memberType === "PLT" && (
          <div className="bg-brand-gold/[0.06] border border-brand-gold/30 rounded-md p-5">
            <p className="text-brand-gold font-bold text-sm mb-2">Syarat Menjadi Ahli PLT</p>
            <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
              <li>Beragama Islam.</li>
              <li>Berumur {MIN_AGE_AHLI_PLT} tahun ke atas.</li>
              <li>Bermastautin di Selangor.</li>
              <li>Berdaftar sebagai pemilih/pengundi di Selangor.</li>
            </ul>
            <p className="text-brand-gold font-bold text-sm mb-2 mt-4">Hak Ahli PLT</p>
            <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
              <li>Mempunyai hak untuk mengundi dalam mesyuarat agung.</li>
              <li>Mempunyai hak untuk bertanding jawatan dalam mesyuarat agung.</li>
            </ul>
            <p className="text-white/40 text-xs mt-3">
              Umur disemak automatik daripada No. Kad Pengenalan. Kelayakan lain akan disahkan
              secara manual oleh pihak PLT selepas bayaran &ndash; status keahlian akan berstatus
              &ldquo;Menunggu Semakan&rdquo; sehingga disahkan.
            </p>
          </div>
        )}

        {/* Syarat keahlian Ahli Bersekutu */}
        {memberType === "BERSEKUTU" && (
          <div className="bg-brand-gold/[0.06] border border-brand-gold/30 rounded-md p-5">
            <p className="text-brand-gold font-bold text-sm mb-2">Syarat Menjadi Ahli Bersekutu</p>
            <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
              <li>Beragama Islam.</li>
              <li>Berumur 18 tahun ke atas.</li>
              <li>Terbuka kepada awam.</li>
            </ul>
            <p className="text-brand-gold font-bold text-sm mb-2 mt-4">Hak Ahli Bersekutu</p>
            <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
              <li>Boleh menyertai aktiviti pertubuhan.</li>
              <li>Tiada hak untuk mengundi atau bertanding jawatan dalam mesyuarat agung.</li>
            </ul>
            <p className="text-white/40 text-xs mt-3">
              Pendaftaran akan disahkan secara manual oleh pihak PLT selepas bayaran &ndash; status
              keahlian akan berstatus &ldquo;Menunggu Semakan&rdquo; sehingga disahkan.
            </p>
          </div>
        )}

        {/* Step 1 - form */}
        <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
            <IconUserCircle />
            <span>1. MASUKKAN MAKLUMAT &ndash; {TYPE_INFO[memberType].title}</span>
          </div>
          <p className="text-white/60 text-sm mb-5">
            Yuran keahlian akan diproses melalui BayarCash selepas maklumat disahkan.
          </p>

          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/80">Nama Penuh</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Ahmad bin Ali"
                className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/80">No. Kad Pengenalan (tanpa tanda -)</label>
              <input
                required
                pattern="[0-9]{12}"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                placeholder="Contoh: 900101011234"
                className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/80">No. Telefon</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0123456789"
                className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/80">E-mel</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: ahmad@email.com"
                className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
              />
            </div>

            {memberType === "PLT" && (
              <label className="flex items-start gap-3 bg-black/20 border border-white/15 rounded-sm p-3 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={akuanSelangor}
                  onChange={(e) => setAkuanSelangor(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  Saya mengesahkan bahawa saya <strong className="text-white">bermastautin di Selangor</strong> dan/atau{" "}
                  <strong className="text-white">berdaftar sebagai pengundi di Selangor</strong>. Saya faham status
                  keahlian PLT saya akan berstatus &ldquo;Menunggu Semakan&rdquo; sehingga disahkan oleh pihak PLT.
                </span>
              </label>
            )}

            {error && step === "form" && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconUserCircle />
              {loading && step === "form" ? "MEMUATKAN..." : "DAFTAR KEAHLIAN"}
            </button>
          </form>

          <p className="text-xs text-white/50 mt-4">
            Sudah mendaftar?{" "}
            <Link href={memberType === "PLT" ? "/keahlian/semak-plt" : "/keahlian/semak"} className="text-brand-gold underline">
              Semak nombor ahli anda di sini
            </Link>
            .
          </p>
        </div>

        {/* Step 2 - sahkan & bayar */}
        <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-5">
            <IconShieldCheck />
            <span>2. SAHKAN &amp; BAYAR</span>
          </div>

          {step === "form" || yuranSen === null ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-brand-gold">
                <IconIdCard />
              </div>
              <p className="text-white/60 text-sm max-w-xs">
                Lengkapkan borang di atas dan klik &ldquo;DAFTAR KEAHLIAN&rdquo; untuk sahkan maklumat dan yuran keahlian sebelum bayaran.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm space-y-1.5 border-b border-white/10 pb-4">
                <p className="text-white/60"><span className="text-white/40">Jenis Keahlian:</span> {TYPE_INFO[memberType].title}</p>
                <p className="text-white/60"><span className="text-white/40">Nama Penuh:</span> {fullName}</p>
                <p className="text-white/60"><span className="text-white/40">No Kad Pengenalan:</span> {icNumber}</p>
                <p className="text-white/60"><span className="text-white/40">No Telefon:</span> {phone}</p>
                <p className="text-white/60"><span className="text-white/40">E-mel:</span> {email}</p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70 font-semibold">Yuran Keahlian</span>
                <span className="font-bold text-xl text-brand-gold">{formatRM(yuranSen)}</span>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  disabled={loading}
                  className="flex-1 border border-white/20 text-white font-semibold py-3 rounded-sm hover:bg-white/5 disabled:opacity-50"
                >
                  KEMBALI
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
                >
                  {loading ? "MEMPROSES..." : "SAHKAN & BAYAR"}
                </button>
              </div>
            </div>
          )}
        </div>

        <OrgInfoCard />
      </div>
    </div>
  );
}
