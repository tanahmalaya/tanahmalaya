"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconUserCircle, IconShieldCheck, IconIdCard } from "@/components/keahlian/icons";
import OrgInfoCard from "@/components/keahlian/OrgInfoCard";

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default function KeahlianPage() {
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [yuranSen, setYuranSen] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/settings/yuran");
      const data = await res.json();
      setYuranSen(data.yuranSen);
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
      <div className="max-w-4xl mx-auto px-6 py-3 text-xs text-white/50 flex items-center gap-2">
        <Link href="/" className="hover:text-white">Utama</Link>
        <span>&rsaquo;</span>
        <span className="text-brand-gold font-semibold">Keahlian</span>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {/* Step 1 - form */}
        <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
            <IconUserCircle />
            <span>1. MASUKKAN MAKLUMAT</span>
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
            <Link href="/keahlian/semak" className="text-brand-gold underline">
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
