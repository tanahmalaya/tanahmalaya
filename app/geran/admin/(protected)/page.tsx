export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function GeranAdminRingkasanPage() {
  const [geranMenunggu, renMenunggu, dronePilotMenunggu] = await Promise.all([
    prisma.geran.count({ where: { status: "MENUNGGU_SEMAKAN" } }),
    prisma.renApplication.count({ where: { status: "MENUNGGU_SEMAKAN" } }),
    prisma.dronePilotApplication.count({ where: { status: "MENUNGGU_SEMAKAN" } }),
  ]);

  const cards = [
    { href: "/geran/admin/geran", label: "Senarai Tanah", menunggu: geranMenunggu },
    { href: "/geran/admin/ren", label: "Registered REN", menunggu: renMenunggu },
    { href: "/geran/admin/pilot-drone", label: "Drone Pilot", menunggu: dronePilotMenunggu },
  ];

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
    </div>
  );
}
