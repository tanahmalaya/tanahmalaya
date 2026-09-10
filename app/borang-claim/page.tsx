export const dynamic = "force-dynamic";

import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requirePltMember } from "@/lib/memberAuth";
import BackButton from "@/components/BackButton";
import BorangClaimForm, { type ClaimHistoryItem } from "@/components/petty-cash/BorangClaimForm";

export const metadata = {
  title: "Claim",
  robots: { index: false },
};

// Kawasan Ahli PLT sahaja - lihat lib/memberAuth.ts.
export default async function BorangClaimPage() {
  const member = await requirePltMember("/borang-claim");

  const claims = await prisma.pettyCashClaim.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "desc" },
  });

  const history: ClaimHistoryItem[] = claims.map((c) => ({
    id: c.id,
    seq: c.seq,
    jumlahSen: c.jumlahSen,
    kategori: c.kategori,
    tujuan: c.tujuan,
    tarikhPerbelanjaan: c.tarikhPerbelanjaan.toISOString(),
    status: c.status,
    catatanAdmin: c.catatanAdmin,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="bg-white text-brand-dark">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#FBF9F6] to-white border-b border-black/5">
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,138,46,0.16) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="max-w-2xl mx-auto px-6 py-10 flex items-center gap-5 relative">
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-brand-gold/40">
            <Image src="/logo.png" width={64} height={64} alt="Pertubuhan Literasi Tanah" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide">CLAIM</h1>
            <p className="text-brand-dark/60 text-sm mt-1">Ahli PLT: {member.fullName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <BackButton href="/keahlian" label="Kembali" />
        <div className="flex items-center gap-5 text-sm font-bold">
          <a href="/peta" className="text-brand-dark hover:text-brand-gold underline">Peta</a>
          <a href="/kelas-tanah" className="text-brand-dark hover:text-brand-gold underline">Kelas &amp; Program</a>
          <form action="/api/members/logout" method="POST">
            <button type="submit" className="text-red-600 hover:text-red-700 underline">Log Keluar</button>
          </form>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        <BorangClaimForm
          memberNo={member.memberNo}
          savedBankName={member.savedBankName}
          savedAccountNo={member.savedAccountNo}
          savedAccountHolder={member.savedAccountHolder}
          initialHistory={history}
        />
      </div>
    </div>
  );
}
