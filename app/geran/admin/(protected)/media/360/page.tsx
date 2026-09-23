export const dynamic = "force-dynamic";

import Link from "next/link";
import { MapPin, Orbit } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bacaHotspot } from "@/lib/geran/panorama";

// Media > 360°: semua panorama merentas penyenaraian, dengan bilangan hotspot
// dan sama ada kamera sudah diletak atas peta.
export default async function Media360Page() {
  const panorama = await prisma.panorama.findMany({
    orderBy: [{ geran: { updatedAt: "desc" } }, { susunan: "asc" }],
    select: {
      id: true,
      url: true,
      tajuk: true,
      latitude: true,
      hotspots: true,
      lot: { select: { noLot: true } },
      geran: { select: { id: true, seq: true, tajuk: true } },
    },
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <p className="text-sm text-black/45">Media</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">360° Panoramas</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-6">
        {panorama.length} panoramas. Open one to edit hotspots, the Explore tour and the camera position.
      </p>

      {panorama.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-10 flex flex-col items-center text-center">
          <Orbit size={26} className="text-black/25 mb-2" />
          <p className="font-semibold">No 360° photos yet</p>
          <p className="text-sm text-black/50 mt-1">Upload them from a listing&apos;s 360° tab.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {panorama.map((p) => (
            <li key={p.id}>
              <Link
                href={`/geran/admin/geran/${p.geran.id}?tab=360`}
                className="block bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full aspect-[2/1] object-cover" />
                <div className="p-3.5">
                  <p className="font-semibold truncate">{p.tajuk || "360° photo"}</p>
                  <p className="text-xs text-black/45 truncate">
                    #{p.geran.seq} {p.geran.tajuk}
                  </p>
                  <p className="text-xs text-black/55 mt-2 flex items-center gap-3">
                    <span>{bacaHotspot(p.hotspots).length} hotspots</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {p.latitude !== null ? (p.lot ? `On ${p.lot.noLot}` : "Camera placed") : "No camera position"}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
