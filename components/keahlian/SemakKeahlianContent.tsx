"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { IconUserCircle, IconShieldCheck, IconIdCard, IconSearch } from "@/components/keahlian/icons";
import OrgInfoCard from "@/components/keahlian/OrgInfoCard";
import MembershipCard from "@/components/keahlian/MembershipCard";
import WhatsappGroupCard from "@/components/keahlian/WhatsappGroupCard";
import RefundRequestForm from "@/components/keahlian/RefundRequestForm";
import BackButton from "@/components/BackButton";

type MemberType = "PLT" | "BERSEKUTU";

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  MENUNGGU_BAYARAN: "Menunggu Bayaran",
  MENUNGGU_SEMAKAN: "Menunggu Semakan",
};

const STATUS_BADGE: Record<string, string> = {
  AKTIF: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  TIDAK_AKTIF: "bg-red-50 text-red-600 border border-red-200",
  MENUNGGU_BAYARAN: "bg-amber-50 text-amber-700 border border-amber-200",
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
};

const TYPE_LABEL: Record<MemberType, string> = {
  PLT: "Ahli PLT",
  BERSEKUTU: "Ahli Bersekutu",
};

const CARD = "bg-white border border-black/5 border-l-4 border-l-emerald-500/70 rounded-2xl shadow-sm shadow-black/[0.04] p-6 md:p-7";
const INPUT = "w-full bg-[#F7F5F1] border border-black/10 rounded-xl p-3 text-sm text-brand-dark placeholder-black/30 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 outline-none transition";
const LABEL = "block text-xs font-semibold mb-1.5 text-brand-dark/70";
const BTN_PRIMARY = "w-full bg-brand-gold text-brand-dark font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-sm shadow-brand-gold/30 hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-sm";
const BTN_SECONDARY = "w-full border border-black/10 text-brand-dark font-semibold py-3.5 rounded-full hover:bg-black/[0.03] transition";

type MemberResult = {
  memberNo: string;
  noAhliLama: string | null;
  fullName: string;
  type: MemberType;
  status: string;
  joinedAt: string;
  refundRequested: boolean;
  refundedAt: string | null;
};

type Props = {
  expectedType: MemberType;
  otherTypeHref: string;
};

export default function SemakKeahlianContent({ expectedType, otherTypeHref }: Props) {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MemberResult | null>(null);

  const heading = expectedType === "PLT" ? "SEMAK KEAHLIAN AHLI PLT" : "SEMAK KEAHLIAN AHLI BERSEKUTU";
  const otherLabel = expectedType === "PLT" ? TYPE_LABEL.BERSEKUTU : TYPE_LABEL.PLT;

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

  const wrongType = result && result.type !== expectedType;

  return (
    <div className="bg-white text-brand-dark">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#FBF9F6] to-white border-b border-black/5">
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,138,46,0.16) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div
          className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(5,150,105,0.14) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="max-w-4xl mx-auto px-6 py-10 flex items-center gap-5 relative">
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-brand-gold/40">
            <Image src="/logo.png" width={64} height={64} alt="Pertubuhan Literasi Tanah" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide">{heading}</h1>
            <p className="text-brand-dark/60 text-sm mt-1 max-w-lg">
              Semak status keahlian {TYPE_LABEL[expectedType]} anda dalam Pertubuhan Literasi Tanah dengan mudah dan pantas.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-2">
        <BackButton href="/keahlian" label="Kembali" />
        <div className="text-xs text-brand-dark/50 flex items-center gap-2">
          <Link href="/" className="hover:text-brand-dark">Utama</Link>
          <span>&rsaquo;</span>
          <Link href="/keahlian" className="hover:text-brand-dark">Keahlian</Link>
          <span>&rsaquo;</span>
          <span className="text-brand-gold font-semibold">Semak Keahlian</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {/* Step 1 - form */}
        <div className={CARD}>
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
            <IconUserCircle />
            <span>1. MASUKKAN MAKLUMAT</span>
          </div>
          <p className="text-brand-dark/60 text-sm mb-5">
            Sila masukkan maklumat berikut untuk menyemak status keahlian anda.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL}>Nama Penuh</label>
              <input
                name="fullName"
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
                name="icNumber"
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
              {loading ? "MENYEMAK..." : "SEMAK KEAHLIAN"}
            </button>
          </form>

          <p className="text-xs text-brand-dark/50 mt-4">
            Belum berdaftar? <Link href="/keahlian" className="text-brand-gold underline">Daftar sebagai ahli</Link>.
          </p>
        </div>

        {/* Step 2 - result */}
        <div className={CARD}>
          <div className="flex items-center gap-2 text-brand-gold font-bold mb-5">
            <IconShieldCheck />
            <span>2. KEPUTUSAN SEMAKAN</span>
          </div>

          {!result ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                <IconIdCard />
              </div>
              <p className="text-brand-dark/60 text-sm max-w-xs">
                Masukkan maklumat di atas dan klik &ldquo;SEMAK KEAHLIAN&rdquo; untuk melihat status anda.
              </p>
            </div>
          ) : wrongType ? (
            <div className="space-y-4">
              <p className="text-brand-dark/70 text-sm">
                <strong className="text-brand-dark">{result.fullName}</strong> didaftarkan sebagai{" "}
                <strong className="text-brand-gold">{otherLabel}</strong>, bukan {TYPE_LABEL[expectedType]}.
              </p>
              <Link href={otherTypeHref} className={BTN_PRIMARY}>
                SEMAK DI HALAMAN {otherLabel.toUpperCase()}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {result.status === "AKTIF" && (
                <MembershipCard
                  type={result.type}
                  fullName={result.fullName}
                  memberNo={result.memberNo}
                  joinedAt={result.joinedAt}
                />
              )}
              <div className="text-sm space-y-1.5 border-b border-black/10 pb-4">
                <p className="text-brand-dark/60"><span className="text-brand-dark/40">Nama:</span> {result.fullName}</p>
                <p className="text-brand-dark/60"><span className="text-brand-dark/40">Jenis Keahlian:</span> {TYPE_LABEL[result.type]}</p>
                <p className="text-brand-dark/60">
                  <span className="text-brand-dark/40">Tarikh Daftar:</span>{" "}
                  {new Date(result.joinedAt).toLocaleDateString("ms-MY")}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-dark/70 font-semibold">Nombor Ahli</span>
                <span className="font-bold text-xl text-brand-gold text-right">
                  {result.memberNo}
                  {result.noAhliLama && (
                    <span className="block text-xs font-normal text-brand-dark/50">
                      (dahulu {result.noAhliLama})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-dark/70 font-semibold">Status</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[result.status] || "bg-black/5 text-brand-dark border border-black/10"}`}>
                  {STATUS_LABEL[result.status] || result.status}
                </span>
              </div>
              {result.status === "TIDAK_AKTIF" && (
                <p className="text-brand-dark/50 text-xs">
                  Pendaftaran ini tidak dapat diteruskan. Sila lihat borang mohon refund di bawah.
                </p>
              )}
              <button type="button" onClick={() => setResult(null)} className={BTN_SECONDARY}>
                SEMAK LAGI
              </button>
            </div>
          )}
        </div>

        {/* Step 3 - sertai WhatsApp group - hanya papar selepas semakan jumpa
            rekod ahli AKTIF sebenar bagi jenis keahlian yang betul, elak QR
            group didedahkan kepada sesiapa saja yang buka laman ni. */}
        {result && !wrongType && result.status === "AKTIF" && <WhatsappGroupCard variant={expectedType} />}

        {/* Pendaftaran ditolak - buka borang mohon refund yuran yang dah dibayar. */}
        {result && !wrongType && result.status === "TIDAK_AKTIF" && (
          <RefundRequestForm
            fullName={result.fullName}
            icNumber={icNumber}
            alreadyRequested={result.refundRequested}
            refunded={!!result.refundedAt}
          />
        )}

        <OrgInfoCard variant="light" />
      </div>
    </div>
  );
}
