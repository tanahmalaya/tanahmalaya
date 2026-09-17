export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import GeranAdminTable, { type GeranAdminRow } from "@/components/geran/GeranAdminTable";

export default async function AdminGeranPage() {
  const include = { seller: { select: { renDisahkan: true } }, assignedRen: { select: { fullName: true } } } as const;

  const [menunggu, disahkan, ditolak, renOptionsRaw] = await Promise.all([
    prisma.geran.findMany({ where: { status: "MENUNGGU_SEMAKAN" }, orderBy: { createdAt: "asc" }, include }),
    prisma.geran.findMany({ where: { status: "DISAHKAN" }, orderBy: { createdAt: "desc" }, take: 100, include }),
    prisma.geran.findMany({ where: { status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50, include }),
    prisma.seller.findMany({ where: { renDisahkan: true }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
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
    mintaDroneSurvey: g.mintaDroneSurvey,
    statusDroneSurvey: g.statusDroneSurvey,
    status: g.status,
    catatanAdmin: g.catatanAdmin,
    createdAt: g.createdAt.toISOString(),
    sellerIsRen: g.seller.renDisahkan,
    assignedRenNama: g.assignedRen?.fullName ?? null,
  });

  const rows: GeranAdminRow[] = [...menunggu.map(toRow), ...disahkan.map(toRow), ...ditolak.map(toRow)];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Geran (Land Sale Marketplace)</h1>
      <GeranAdminTable rows={rows} renOptions={renOptionsRaw} />
    </div>
  );
}
