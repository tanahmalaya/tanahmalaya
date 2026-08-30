"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { IconUserCircle, IconShieldCheck, IconIdCard, IconSearch } from "@/components/keahlian/icons";
import OrgInfoCard from "@/components/keahlian/OrgInfoCard";
import WhatsappGroupCard from "@/components/keahlian/WhatsappGroupCard";

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  MENUNGGU_BAYARAN: "Menunggu Bayaran",
};

type MemberResult = {
  memberNo: string;
  fullName: string;
  status: string;
  joinedAt: string;
};

export default function SemakKeahlianPage() {
  return (
    <Suspense fallback={null}>
      <SemakKeahlianContent />
    </Suspense>
  );
}

function SemakKeahlianContent() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MemberResult | null>(null);

  async function checkMember(name: string, ic: string) {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/members/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, icNumber: ic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal semak keahlian");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Baru habis daftar & bayar (dihantar dari /keahlian selepas BayarCash) -
  // prefill & terus semak automatik supaya ahli baru terus nampak status dia.
  useEffect(() => {
    const qName = searchParams.get("fullName");
    const qIc = searchParams.get("icNumber");
    if (qName && qIc) {
      setFullName(qName);
      setIcNumber(qIc);
      checkMember(qName, qIc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    checkMember(fullName, icNumber);
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide">SEMAK KEAHLIAN</h1>
            <p className="text-white/60 text-sm mt-1 max-w-lg">
              Semak status keahlian anda dalam Pertubuhan Literasi Tanah dengan mudah dan pantas.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-3 text-xs text-white/50 flex items-center gap-2">
        <Link href="/" className="hover:text-white">Utama</Link>
        <span>&rsaquo;</span>
        <Link href="/keahlian" className="hover:text-white">Keahlian</Link>
        <span>&rsaquo;</span>
        <span className="text-brand-gold font-semibold">Semak Keahlian</span>
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
            Sila masukkan maklumat berikut untuk menyemak status keahlian anda.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/80">Nama Penuh</label>
              <input
                name="fullName"
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
                name="icNumber"
                required
                pattern="[0-9]{12}"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                placeholder="Contoh: 900101011234"
                className="w-full bg-black/20 border border-white/15 rounded-sm p-3 text-sm text-white placeholder-white/30 focus:border-brand-gold outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconSearch />
              {loading ? "MENYEMAK..." : "SEMAK KEAHLIAN"}
            </button>
          </form>

          <p className="text-xs text-white/50 mt-4">
            Belum berdaftar? <Link href="/keahlian" className="text-brand-gold underline">Daftar sebagai ahli</Link>.
          </p>
        </div>

        {/* Step 2 - result */}
        <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-5">
            <IconShieldCheck />
            <span>2. KEPUTUSAN SEMAKAN</span>
          </div>

          {!result ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-brand-gold">
                <IconIdCard />
              </div>
              <p className="text-white/60 text-sm max-w-xs">
                Masukkan maklumat di atas dan klik &ldquo;SEMAK KEAHLIAN&rdquo; untuk melihat status anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm space-y-1.5 border-b border-white/10 pb-4">
                <p className="text-white/60"><span className="text-white/40">Nama:</span> {result.fullName}</p>
                <p className="text-white/60">
                  <span className="text-white/40">Tarikh Daftar:</span>{" "}
                  {new Date(result.joinedAt).toLocaleDateString("ms-MY")}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 font-semibold">Nombor Ahli</span>
                <span className="font-bold text-xl text-brand-gold">{result.memberNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 font-semibold">Status</span>
                <span className="font-semibold">{STATUS_LABEL[result.status] || result.status}</span>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="w-full border border-white/20 text-white font-semibold py-3 rounded-sm hover:bg-white/5"
              >
                SEMAK LAGI
              </button>
            </div>
          )}
        </div>

        {/* Step 3 - sertai WhatsApp group - hanya papar selepas semakan jumpa
            rekod ahli sebenar (result != null), elak QR group didedahkan
            kepada sesiapa saja yang buka laman ni tanpa disahkan ahli dulu. */}
        {result && <WhatsappGroupCard />}

        <OrgInfoCard />
      </div>
    </div>
  );
}
