export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SUMBER_GERAN_LABEL } from "@/lib/geran";

export default async function GeranAdminRingkasanPage() {
  const [geranMenunggu, ikutSumber] = await Promise.all([
    prisma.geran.count({ where: { status: "MENUNGGU_SEMAKAN" } }),
    prisma.geran.groupBy({ by: ["sumber"], _count: { _all: true } }),
  ]);

  const cards = [{ href: "/geran/admin/geran", label: "Senarai Tanah", menunggu: geranMenunggu }];

  // Susun ikut urutan tetap supaya sumber yang tiada penyenaraian pun tetap
  // kelihatan (0), bukan hilang terus dari ringkasan.
  const sumberRows = (["PLT", "KJ_LAND", "PENGGUNA"] as const).map((s) => ({
    sumber: s,
    jumlah: ikutSumber.find((r) => r.sumber === s)?._count._all ?? 0,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Ringkasan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-black/60">{c.label}</p>
            <p className="text-3xl font-display font-bold mt-2">{c.menunggu}</p>
            <p className="text-xs text-black/40 mt-1">menunggu semakan</p>
          </Link>
        ))}
      </div>

      <h2 className="font-display text-lg font-bold mt-8 mb-3">Penyenaraian ikut sumber</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sumberRows.map((r) => (
          <div key={r.sumber} className="bg-white rounded-md shadow-sm p-6">
            <p className="text-sm text-black/60">{SUMBER_GERAN_LABEL[r.sumber]}</p>
            <p className="text-3xl font-display font-bold mt-2">{r.jumlah}</p>
            <p className="text-xs text-black/40 mt-1">jumlah penyenaraian</p>
          </div>
        ))}
      </div>
    </div>
  );
}
