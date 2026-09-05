export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_ADUAN_LABEL, KATEGORI_TANAH_LABEL } from "@/lib/aduanTanah";

const TABS = [
  { value: "SEMUA", label: "Semua" },
  { value: "BAHARU", label: "Baharu" },
  { value: "DALAM_SEMAKAN", label: "Dalam Semakan" },
  { value: "SELESAI", label: "Selesai" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  BAHARU: "bg-amber-100 text-amber-700",
  DALAM_SEMAKAN: "bg-blue-100 text-blue-700",
  SELESAI: "bg-green-100 text-green-700",
};

export default async function AdminAduanTanahPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  requireAdminOnly();
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : "SEMUA";

  const semua = await prisma.landComplaint.findMany({ orderBy: { createdAt: "desc" } });
  const aduan = tab === "SEMUA" ? semua : semua.filter((a) => a.status === tab);
  const countByTab = Object.fromEntries(
    TABS.map((t) => [t.value, t.value === "SEMUA" ? semua.length : semua.filter((a) => a.status === t.value).length])
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-2">Aduan Pencerobohan Tanah</h1>
      <p className="text-sm text-brand-dark/60 mb-6">
        Senarai aduan yang dihantar melalui borang di laman Hubungi Kami.
      </p>

      <div className="flex gap-1 border-b border-brand-dark/10 mb-4">
        {TABS.map((t) => (
          <a
            key={t.value}
            href={`/admin/aduan-tanah?tab=${t.value}`}
            className={
              "px-4 py-2 text-sm font-semibold rounded-t-sm -mb-px border-b-2 " +
              (tab === t.value
                ? "border-brand-gold text-brand-dark"
                : "border-transparent text-brand-dark/50 hover:text-brand-dark")
            }
          >
            {t.label} ({countByTab[t.value]})
          </a>
        ))}
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">Rujukan</th>
              <th className="p-4">Tarikh</th>
              <th className="p-4">Pengadu</th>
              <th className="p-4">Lokasi</th>
              <th className="p-4">Kategori Tanah</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {aduan.map((a) => (
              <tr key={a.id} className="border-t border-brand-cream">
                <td className="p-4 font-medium">#{a.seq}</td>
                <td className="p-4 whitespace-nowrap">{a.createdAt.toLocaleDateString("ms-MY")}</td>
                <td className="p-4">{a.anonim ? <span className="text-brand-dark/50 italic">Anonim</span> : a.namaPenuh || "-"}</td>
                <td className="p-4">
                  {a.daerahMukim}, {a.negeri}
                </td>
                <td className="p-4">{KATEGORI_TANAH_LABEL[a.statusKategoriTanah] || a.statusKategoriTanah}</td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${STATUS_BADGE[a.status]}`}>
                    {STATUS_ADUAN_LABEL[a.status] || a.status}
                  </span>
                </td>
                <td className="p-4">
                  <Link href={`/admin/aduan-tanah/${a.id}`} className="text-brand-gold text-xs font-bold">
                    LIHAT
                  </Link>
                </td>
              </tr>
            ))}
            {aduan.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-brand-dark/50">
                  Tiada aduan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
