export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/geran/admin/StatusBadge";

// Media > Photos: pustaka gambar merentas semua penyenaraian. Menyunting
// (susun, padam, muat naik) tetap dalam tab Media editor setiap listing.
export default async function MediaPhotosPage() {
  const gerans = await prisma.geran.findMany({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, seq: true, tajuk: true, status: true, gambarUrls: true },
  });
  const ada = gerans.filter((g) => g.gambarUrls.length > 0);
  const tiada = gerans.filter((g) => g.gambarUrls.length === 0);
  const jumlah = ada.reduce((n, g) => n + g.gambarUrls.length, 0);

  return (
    <div className="max-w-[1400px] mx-auto">
      <p className="text-sm text-black/45">Media</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Photos</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-6">
        {jumlah} photos across {ada.length} listings. Open a listing to reorder, upload or mark lots.
      </p>

      <div className="space-y-5">
        {ada.map((g) => (
          <section key={g.id} className="bg-white rounded-2xl border border-black/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="font-semibold truncate">
                  #{g.seq} {g.tajuk}
                </p>
                <StatusBadge status={g.status} />
              </div>
              <Link href={`/geran/admin/geran/${g.id}?tab=media`} className="text-sm font-semibold text-emerald-700 hover:underline">
                Manage media →
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {g.gambarUrls.map((u, i) => (
                <span key={u} className="relative w-36 h-24 shrink-0 rounded-lg overflow-hidden bg-black/[0.04]">
                  <Image src={u} alt="" fill sizes="144px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">Cover</span>
                  )}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      {tiada.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55 mb-3 flex items-center gap-2">
            <ImageOff size={15} /> Listings without photos ({tiada.length})
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {tiada.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/geran/admin/geran/${g.id}?tab=media`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white border border-black/[0.06] px-3 py-2.5 text-sm hover:bg-black/[0.02]"
                >
                  <span className="truncate">
                    #{g.seq} {g.tajuk}
                  </span>
                  <StatusBadge status={g.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
