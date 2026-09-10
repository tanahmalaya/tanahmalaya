export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import PettyCashClaimsTable, { type ClaimRow } from "@/components/PettyCashClaimsTable";

export default async function AdminPettyCashPage() {
  const [menunggu, diluluskan, ditolak, dibayar] = await Promise.all([
    prisma.pettyCashClaim.findMany({ where: { status: "MENUNGGU" }, orderBy: { createdAt: "asc" } }),
    prisma.pettyCashClaim.findMany({ where: { status: "DILULUSKAN" }, orderBy: { createdAt: "asc" } }),
    prisma.pettyCashClaim.findMany({ where: { status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.pettyCashClaim.findMany({ where: { status: "DIBAYAR" }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const toRow = (c: (typeof menunggu)[number]): ClaimRow => ({
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
  });

  const claims: ClaimRow[] = [
    ...menunggu.map(toRow),
    ...diluluskan.map(toRow),
    ...ditolak.map(toRow),
    ...dibayar.map(toRow),
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Tuntutan Petty Cash</h1>
      <PettyCashClaimsTable claims={claims} />
    </div>
  );
}
