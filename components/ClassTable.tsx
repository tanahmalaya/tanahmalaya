import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  TERBUKA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENUH: "bg-amber-50 text-amber-700 border-amber-200",
  TAMAT: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  TERBUKA: "Terbuka",
  PENUH: "Penuh",
  TAMAT: "Tamat",
};

function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="7.5" y1="14" x2="7.5" y2="14" />
      <line x1="12" y1="14" x2="12" y2="14" />
      <line x1="16.5" y1="14" x2="16.5" y2="14" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default async function ClassTable() {
  const classes = await prisma.landClass.findMany({
    orderBy: { tarikh: "asc" },
    take: 4,
  });

  return (
    <section>
      <h2 className="font-display text-2xl font-bold mb-6">PROGRAM &amp; KELAS</h2>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm shadow-black/[0.03] overflow-hidden">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-6">
            <div className="w-14 h-14 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4">
              <CalendarIcon />
            </div>
            <p className="font-semibold text-brand-dark mb-1.5">Belum ada program/kelas dijadualkan</p>
            <p className="text-sm text-brand-dark/50 max-w-sm">
              Jadual program dan kelas akan datang anjuran PLT akan dipaparkan di sini sebaik sedia.
            </p>
          </div>
        ) : (
          <>
            {/* Jadual penuh - desktop/tablet */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-cream/60">
                  <tr className="text-left">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">Tarikh</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">Nama</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">Topik</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">Lokasi</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">Status</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {classes.map((k) => (
                    <tr key={k.id} className="border-t border-black/5 hover:bg-brand-cream/30 transition-colors">
                      <td className="p-4 whitespace-nowrap text-brand-dark/70">{k.tarikh.toLocaleDateString("ms-MY")}</td>
                      <td className="p-4 font-semibold">{k.namaKelas}</td>
                      <td className="p-4 text-brand-dark/70">{k.topik}</td>
                      <td className="p-4 text-brand-dark/70">{k.lokasi}</td>
                      <td className="p-4">
                        <StatusBadge status={k.status} />
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link href={`/kelas-tanah/${k.id}`} className="text-brand-gold text-xs font-bold hover:underline">
                          LIHAT →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Senarai kad - mobile */}
            <div className="sm:hidden divide-y divide-black/5">
              {classes.map((k) => (
                <Link key={k.id} href={`/kelas-tanah/${k.id}`} className="block p-4 hover:bg-brand-cream/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="font-semibold">{k.namaKelas}</p>
                    <StatusBadge status={k.status} />
                  </div>
                  <p className="text-sm text-brand-dark/70">{k.topik}</p>
                  <p className="text-xs text-brand-dark/50 mt-1.5">
                    {k.tarikh.toLocaleDateString("ms-MY")} · {k.lokasi}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
