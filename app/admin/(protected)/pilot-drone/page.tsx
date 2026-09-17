export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import DronePilotAdminTable, { type DronePilotAdminRow } from "@/components/geran/DronePilotAdminTable";

export default async function AdminPilotDronePage() {
  const [menunggu, disahkan, ditolak] = await Promise.all([
    prisma.dronePilotApplication.findMany({ where: { status: "MENUNGGU_SEMAKAN" }, orderBy: { createdAt: "asc" } }),
    prisma.dronePilotApplication.findMany({ where: { status: "DISAHKAN" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.dronePilotApplication.findMany({ where: { status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const toRow = (p: (typeof menunggu)[number]): DronePilotAdminRow => ({
    id: p.id,
    seq: p.seq,
    namaPenuh: p.namaPenuh,
    telefon: p.telefon,
    negeri: p.negeri,
    modelDrone: p.modelDrone,
    status: p.status,
    catatanAdmin: p.catatanAdmin,
    createdAt: p.createdAt.toISOString(),
  });

  const rows: DronePilotAdminRow[] = [...menunggu.map(toRow), ...disahkan.map(toRow), ...ditolak.map(toRow)];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Drone Pilot</h1>
      <DronePilotAdminTable rows={rows} />
    </div>
  );
}
