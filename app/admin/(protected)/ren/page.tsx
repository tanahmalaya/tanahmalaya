export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import RenAdminTable, { type RenAdminRow } from "@/components/geran/RenAdminTable";

export default async function AdminRenPage() {
  const [menunggu, disahkan, ditolak] = await Promise.all([
    prisma.renApplication.findMany({ where: { status: "MENUNGGU_SEMAKAN" }, orderBy: { createdAt: "asc" } }),
    prisma.renApplication.findMany({ where: { status: "DISAHKAN" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.renApplication.findMany({ where: { status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const toRow = (p: (typeof menunggu)[number]): RenAdminRow => ({
    id: p.id,
    seq: p.seq,
    namaPenuh: p.namaPenuh,
    telefon: p.telefon,
    negeri: p.negeri,
    noRen: p.noRen,
    status: p.status,
    catatanAdmin: p.catatanAdmin,
    createdAt: p.createdAt.toISOString(),
  });

  const rows: RenAdminRow[] = [...menunggu.map(toRow), ...disahkan.map(toRow), ...ditolak.map(toRow)];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">PLT-Registered REN</h1>
      <RenAdminTable rows={rows} />
    </div>
  );
}
