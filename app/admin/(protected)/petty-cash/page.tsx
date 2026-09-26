export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import PettyCashClaimsTable, { type ClaimRow, type ClaimTab } from "@/components/PettyCashClaimsTable";

const TABS: ClaimTab[] = ["all", "new", "approved", "rejected"];

export default async function AdminPettyCashPage({ searchParams }: { searchParams: { tab?: string } }) {
  // Semua claim diambil sekali - tab "All" perlukan semuanya, dan carian /
  // penapis / statistik dibuat di klien. Isipadu claim petty cash kecil.
  const rows = await prisma.pettyCashClaim.findMany({ orderBy: { createdAt: "desc" } });

  const claims: ClaimRow[] = rows.map((c) => ({
    id: c.id,
    seq: c.seq,
    namaPemohon: c.namaPemohon,
    memberNo: c.memberNo,
    jumlahSen: c.jumlahSen,
    kategori: c.kategori,
    tujuan: c.tujuan,
    tarikhPerbelanjaan: c.tarikhPerbelanjaan.toISOString(),
    resitUrl: c.resitUrl,
    bankName: c.bankName,
    accountNo: c.accountNo,
    accountHolder: c.accountHolder,
    status: c.status,
    catatanAdmin: c.catatanAdmin,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const initialTab = TABS.includes(searchParams.tab as ClaimTab) ? (searchParams.tab as ClaimTab) : "new";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Claim</h1>
      <PettyCashClaimsTable claims={claims} initialTab={initialTab} />
    </div>
  );
}
