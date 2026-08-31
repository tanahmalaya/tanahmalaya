import { prisma } from "@/lib/prisma";
import ActivityImages from "@/components/ActivityImages";

export default async function ActivityGrid() {
  const activities = await prisma.activity.findMany({
    orderBy: { tarikh: "desc" },
    take: 4,
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-display text-2xl font-bold mb-6">AKTIVITI TERKINI</h2>
      {activities.length === 0 ? (
        <p className="text-brand-dark/50">
          Belum ada aktiviti. Tambah dari dashboard admin.
        </p>
      ) : (
        // Side-scroll (bukan grid) - kad dilangkau seret/swipe secara mendatar.
        // -mx-6 px-6 supaya scroll area "bleed" sehingga tepi viewport pada
        // mobile, tapi kad pertama tetap segaris dengan padding tajuk di atas.
        <div
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6
            [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-brand-dark/20 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {activities.map((a) => {
            const gambarList = [a.gambar1, a.gambar2, a.gambar3, a.gambar4].filter(
              (url): url is string => Boolean(url)
            );

            return (
              <div
                key={a.id}
                className="relative bg-white rounded-md shadow-sm overflow-hidden shrink-0 snap-start w-[260px] sm:w-[300px]"
              >
                <ActivityImages gambarList={gambarList} tajuk={a.tajuk} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                  <p className="font-semibold text-sm text-white mb-0.5">{a.tajuk}</p>
                  <p className="text-xs text-white/80">
                    {a.tarikh.toLocaleDateString("ms-MY")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
