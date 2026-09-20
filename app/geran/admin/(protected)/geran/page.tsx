export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import GeranAdminTable, { type GeranAdminRow } from "@/components/geran/GeranAdminTable";

export default async function GeranAdminGeranPage() {
  const [menunggu, disahkan, ditolak] = await Promise.all([
    prisma.geran.findMany({ where: { status: "MENUNGGU_SEMAKAN" }, orderBy: { createdAt: "asc" } }),
    prisma.geran.findMany({ where: { status: "DISAHKAN" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.geran.findMany({ where: { status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const toRow = (g: (typeof menunggu)[number]): GeranAdminRow => ({
    id: g.id,
    seq: g.seq,
    namaPenjual: g.namaPenjual,
    telefonPenjual: g.telefonPenjual,
    emelPenjual: g.emelPenjual,
    tajuk: g.tajuk,
    negeri: g.negeri,
    daerahMukim: g.daerahMukim,
    nomborLot: g.nomborLot,
    nomborGeran: g.nomborGeran,
    jenisTanah: g.jenisTanah,
    jenisHakmilik: g.jenisHakmilik,
    keluasan: g.keluasan,
    unitKeluasan: g.unitKeluasan,
    hargaSen: Number(g.hargaSen),
    keterangan: g.keterangan,
    gambarUrls: g.gambarUrls,
    status: g.status,
    catatanAdmin: g.catatanAdmin,
    createdAt: g.createdAt.toISOString(),
  });

  const rows: GeranAdminRow[] = [...menunggu.map(toRow), ...disahkan.map(toRow), ...ditolak.map(toRow)];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Geran (Land Sale Marketplace)</h1>
      <GeranAdminTable rows={rows} />
    </div>
  );
}
