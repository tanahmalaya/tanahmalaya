export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DOKUMEN_SENARAI_SEMAK, JENIS_DOKUMEN, type JenisDokumenKey } from "@/lib/geran/dokumen";
import StatusBadge from "@/components/geran/admin/StatusBadge";

// Documents: kelengkapan Document Vault setiap penyenaraian - supaya admin
// nampak listing mana masih kurang geran, carian rasmi, dll. sebelum disiar.
export default async function DocumentsPage({ searchParams }: { searchParams: { kurang?: string } }) {
  const kurang = DOKUMEN_SENARAI_SEMAK.find((j) => j === searchParams.kurang) ?? null;
  const gerans = await prisma.geran.findMany({
    where: { status: { notIn: ["ARCHIVED", "REJECTED"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      seq: true,
      tajuk: true,
      status: true,
      salinanGeranUrl: true,
      dokumen: { select: { jenis: true } },
    },
  });

  const baris = gerans
    .map((g) => {
      const ada = new Set<JenisDokumenKey>(g.dokumen.map((d) => d.jenis));
      if (g.salinanGeranUrl) ada.add("GERAN");
      return { g, ada, bil: g.dokumen.length + (g.salinanGeranUrl ? 1 : 0) };
    })
    .filter((x) => !kurang || !x.ada.has(kurang));

  const chip = (label: string, nilai: string | null) => (
    <Link
      key={label}
      href={nilai ? `/geran/admin/documents?kurang=${nilai}` : "/geran/admin/documents"}
      className={`rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
        kurang === nilai ? "bg-[#0B2A1F] text-white" : "bg-white border border-black/[0.08] text-black/60 hover:bg-black/[0.03]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Documents</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-5">Document vault completeness for every active listing.</p>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] mb-4">
        {chip("All listings", null)}
        {DOKUMEN_SENARAI_SEMAK.map((j) => chip(`Missing ${JENIS_DOKUMEN[j]}`, j))}
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="text-left text-xs text-black/45 border-b border-black/[0.06] bg-[#FAFBFA]">
              <th className="font-medium px-5 py-3">Land</th>
              {DOKUMEN_SENARAI_SEMAK.map((j) => (
                <th key={j} className="font-medium px-2 py-3 text-center">
                  {JENIS_DOKUMEN[j].replace(" (Geran)", "")}
                </th>
              ))}
              <th className="font-medium px-5 py-3 text-right">Files</th>
            </tr>
          </thead>
          <tbody>
            {baris.map(({ g, ada, bil }) => (
              <tr key={g.id} className="border-b border-black/[0.04] last:border-0 hover:bg-[#FAFBFA]">
                <td className="px-5 py-3">
                  <Link href={`/geran/admin/geran/${g.id}?tab=documents`} className="font-semibold hover:underline">
                    #{g.seq} {g.tajuk}
                  </Link>
                  <span className="block mt-1">
                    <StatusBadge status={g.status} />
                  </span>
                </td>
                {DOKUMEN_SENARAI_SEMAK.map((j) => (
                  <td key={j} className="px-2 py-3 text-center">
                    {ada.has(j) ? (
                      <CheckCircle2 size={18} className="inline text-emerald-600" aria-label="Uploaded" />
                    ) : (
                      <Circle size={18} className="inline text-black/20" aria-label="Missing" />
                    )}
                  </td>
                ))}
                <td className="px-5 py-3 text-right tabular-nums text-black/60">{bil}</td>
              </tr>
            ))}
            {baris.length === 0 && (
              <tr>
                <td colSpan={DOKUMEN_SENARAI_SEMAK.length + 2} className="px-5 py-10 text-center text-black/45">
                  No listings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
