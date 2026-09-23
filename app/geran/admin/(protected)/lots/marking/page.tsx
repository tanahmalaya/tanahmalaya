export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ImageOff, PenTool } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bacaPenanda } from "@/lib/geran/penanda";
import StatusBadge from "@/components/geran/admin/StatusBadge";

// Lots & Map -> Lot Marking: pintu masuk ke Lot Marker untuk setiap
// penyenaraian. Lot Marker sendiri hidup dalam tab Lots editor supaya lukisan
// & maklumat lot disimpan bersama penyenaraian dalam satu Save.
export default async function LotMarkingPage() {
  const gerans = await prisma.geran.findMany({
    where: { status: { notIn: ["ARCHIVED", "REJECTED"] } },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      seq: true,
      tajuk: true,
      negeri: true,
      daerahMukim: true,
      status: true,
      gambarUrls: true,
      penandaLot: true,
      _count: { select: { lots: true } },
    },
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <p className="text-sm text-black/45">Lots &amp; Map</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Lot Marking</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-6">
        Pick a listing to draw its lots, roads and rivers on its aerial or drone photos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {gerans.map((g) => {
          const bentuk = Object.values(bacaPenanda(g.penandaLot)).reduce(
            (n, e) => n + e.ciri.filter((c) => c.lapisan === "lot").length,
            0
          );
          return (
            <Link
              key={g.id}
              href={`/geran/admin/geran/${g.id}?tab=lots`}
              className="group bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[16/9] bg-[#EEF1EF]">
                {g.gambarUrls[0] ? (
                  <Image src={g.gambarUrls[0]} alt="" fill sizes="400px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center text-black/35 text-xs gap-1">
                    <ImageOff size={22} /> No photos yet
                  </span>
                )}
                <span className="absolute top-2.5 left-2.5">
                  <StatusBadge status={g.status} />
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold truncate">{g.tajuk}</p>
                <p className="text-xs text-black/45 mt-0.5">
                  #{g.seq} · {g.daerahMukim}, {g.negeri}
                </p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-black/55">
                    {g._count.lots} {g._count.lots === 1 ? "lot" : "lots"} · {bentuk} drawn · {g.gambarUrls.length} photos
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 group-hover:underline">
                    <PenTool size={13} /> Open marker
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
