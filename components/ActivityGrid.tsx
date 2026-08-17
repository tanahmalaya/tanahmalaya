import { prisma } from "@/lib/prisma";
import Image from "next/image";

export default async function ActivityGrid() {
  const activities = await prisma.activity.findMany({
    orderBy: { tarikh: "desc" },
    take: 4,
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-display text-2xl font-bold mb-6">AKTIVITI TERKINI</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activities.map((a) => (
          <div key={a.id} className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="relative h-32 bg-brand-cream">
              {a.gambarUrl && <Image src={a.gambarUrl} alt={a.tajuk} fill className="object-cover" />}
            </div>
            <div className="p-4">
              <p className="text-xs text-brand-dark/50 mb-1">
                {a.tarikh.toLocaleDateString("ms-MY")}
              </p>
              <p className="font-semibold text-sm mb-1">{a.tajuk}</p>
              <p className="text-xs text-brand-dark/70">{a.keterangan}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="col-span-full text-brand-dark/50">
            Belum ada aktiviti. Tambah dari dashboard admin.
          </p>
        )}
      </div>
    </section>
  );
}
