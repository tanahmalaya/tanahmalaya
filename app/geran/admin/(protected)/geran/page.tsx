export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import GeranAdminTable, { type GeranAdminRow } from "@/components/geran/GeranAdminTable";

// ?status= dari sidebar LANDHUB -> tab jadual. Draft & Sold belum ada dalam
// enum StatusGeran sehingga migrasi workflow, jadi ia papar notis sahaja.
const TAB_IKUT_STATUS: Record<string, GeranAdminRow["status"]> = {
  pending: "MENUNGGU_SEMAKAN",
  active: "DISAHKAN",
  archived: "DITOLAK",
};

export default async function GeranAdminGeranPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const cari: Prisma.GeranWhereInput = q
    ? {
        OR: [
          { tajuk: { contains: q, mode: "insensitive" } },
          { nomborLot: { contains: q, mode: "insensitive" } },
          { nomborGeran: { contains: q, mode: "insensitive" } },
          { negeri: { contains: q, mode: "insensitive" } },
          { daerahMukim: { contains: q, mode: "insensitive" } },
          { namaPenjual: { contains: q, mode: "insensitive" } },
          ...(/^\d+$/.test(q) ? [{ seq: Number(q) }] : []),
        ],
      }
    : {};

  const [menunggu, rundingan, disahkan, ditolak] = await Promise.all([
    prisma.geran.findMany({ where: { ...cari, status: "MENUNGGU_SEMAKAN" }, orderBy: { createdAt: "asc" } }),
    prisma.geran.findMany({ where: { ...cari, status: "DALAM_RUNDINGAN" }, orderBy: { createdAt: "asc" } }),
    prisma.geran.findMany({ where: { ...cari, status: "DISAHKAN" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.geran.findMany({ where: { ...cari, status: "DITOLAK" }, orderBy: { createdAt: "desc" }, take: 50 }),
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
    statusPemilikan: g.statusPemilikan,
    keluasan: g.keluasan,
    unitKeluasan: g.unitKeluasan,
    hargaDimintaSen: g.hargaDimintaSen === null ? null : Number(g.hargaDimintaSen),
    hargaAmbilSen: g.hargaAmbilSen === null ? null : Number(g.hargaAmbilSen),
    hargaSiaranSen: g.hargaSiaranSen === null ? null : Number(g.hargaSiaranSen),
    keterangan: g.keterangan,
    gambarUrls: g.gambarUrls,
    adaSalinanGeran: g.salinanGeranUrl !== null,
    sumber: g.sumber,
    status: g.status,
    catatanAdmin: g.catatanAdmin,
    createdAt: g.createdAt.toISOString(),
  });

  const rows: GeranAdminRow[] = [menunggu, rundingan, disahkan, ditolak].flat().map(toRow);
  const status = searchParams.status ?? "";
  const belumAda = status === "draft" || status === "sold";
  // Tanpa ?status, buka tab pertama yang ada rekod - kalau tidak, hasil
  // carian yang semuanya "Approved" nampak macam tiada padanan langsung.
  const tabAwal = TAB_IKUT_STATUS[status] ?? rows[0]?.status;

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="font-display text-2xl font-extrabold tracking-tight mb-1">Land</h1>
      <p className="text-sm text-black/50 mb-6">
        {q ? (
          <>
            Results for <strong>&ldquo;{q}&rdquo;</strong> ·{" "}
            <Link href="/geran/admin/geran" className="underline">
              clear search
            </Link>
          </>
        ) : (
          "All land listings in GERAN."
        )}
      </p>
      {belumAda && (
        <div className="mb-5 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
          The {status === "draft" ? "Draft" : "Sold"} status arrives with the new listing workflow. Showing all
          listings for now.
        </div>
      )}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5">
        <GeranAdminTable key={`${status}|${q}`} rows={rows} initialTab={tabAwal} />
      </div>
    </div>
  );
}
