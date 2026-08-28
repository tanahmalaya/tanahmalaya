import { prisma } from "@/lib/prisma";
import ActivityImages from "@/components/ActivityImages";

export default async function ActivityGrid() {
  const activities = await prisma.activity.findMany({
    orderBy: { tarikh: "desc" },
    take: 4,
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-display text-2xl font-bold mb-6">Aktiviti TERKINI</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activities.map((a) => {
          const gambarList = [a.gambar1, a.gambar2, a.gambar3, a.gambar4].filter(
            (url): url is string => Boolean(url)
          );

          return (
            <div key={a.id} className="bg-white rounded-md shadow-sm overflow-hidden">
              <ActivityImages gambarList={gambarList} tajuk={a.tajuk} />
              <div className="p-4">
                <p className="text-xs text-brand-dark/50 mb-1">
                  {a.tarikh.toLocaleDateString("ms-MY")}
                </p>
                <p className="font-semibold text-sm mb-1">{a.tajuk}</p>
                <p className="text-xs text-brand-dark/70">{a.keterangan}</p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="col-span-full text-brand-dark/50">
            Belum ada Aktiviti. Tambah dari dashboard admin.
          </p>
        )}
      </div>
    </section>
  );
}
