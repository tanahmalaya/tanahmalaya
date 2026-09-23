export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SUMBER_GERAN_LABEL, formatKeluasan, formatRM } from "@/lib/geran";
import { KUMPULAN_STATUS, STATUS_BUTIRAN_AWAM } from "@/lib/geran/status";
import StatusBadge from "@/components/geran/admin/StatusBadge";

const SAIZ_HALAMAN = 25;
const SUMBER = ["GT", "KJ_LAND", "PENGGUNA"] as const;

type Carian = { status?: string; q?: string; sumber?: string; page?: string };

// Bina URL senarai dengan satu parameter ditukar - penapis lain dikekalkan
// supaya admin boleh gabung status + sumber + carian tanpa hilang pilihan.
function urlDengan(semasa: Carian, ubah: Partial<Carian>) {
  const p = new URLSearchParams();
  const gabung = { ...semasa, ...ubah };
  for (const [k, v] of Object.entries(gabung)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `/geran/admin/geran?${q}` : "/geran/admin/geran";
}

function formatTarikh(d: Date) {
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function LandListPage({ searchParams }: { searchParams: Carian }) {
  const q = searchParams.q?.trim() || "";
  const kumpulan = searchParams.status && KUMPULAN_STATUS[searchParams.status] ? searchParams.status : "";
  const sumber = SUMBER.find((s) => s === searchParams.sumber) ?? "";
  const halaman = Math.max(1, Number(searchParams.page) || 1);

  const cari: Prisma.GeranWhereInput = q
    ? {
        OR: [
          { tajuk: { contains: q, mode: "insensitive" } },
          { nomborLot: { contains: q, mode: "insensitive" } },
          { nomborGeran: { contains: q, mode: "insensitive" } },
          { negeri: { contains: q, mode: "insensitive" } },
          { daerahMukim: { contains: q, mode: "insensitive" } },
          { mukim: { contains: q, mode: "insensitive" } },
          { namaPenjual: { contains: q, mode: "insensitive" } },
          { lots: { some: { noLot: { contains: q, mode: "insensitive" } } } },
          ...(/^\d+$/.test(q) ? [{ seq: Number(q) }] : []),
        ],
      }
    : {};
  const asas: Prisma.GeranWhereInput = { ...cari, ...(sumber ? { sumber } : {}) };
  const where: Prisma.GeranWhereInput = kumpulan
    ? { ...asas, status: { in: KUMPULAN_STATUS[kumpulan].statuses } }
    : asas;

  const [rows, jumlah, ikutStatus] = await Promise.all([
    prisma.geran.findMany({
      where,
      // Yang perlu tindakan dulu bila melihat "Pending", selebihnya terbaru dulu.
      orderBy: kumpulan === "pending" ? { createdAt: "asc" } : { updatedAt: "desc" },
      skip: (halaman - 1) * SAIZ_HALAMAN,
      take: SAIZ_HALAMAN,
      include: { _count: { select: { lots: true } } },
    }),
    prisma.geran.count({ where }),
    prisma.geran.groupBy({ by: ["status"], where: asas, _count: { _all: true } }),
  ]);

  const kiraKumpulan = (k: string) =>
    KUMPULAN_STATUS[k].statuses.reduce((n, s) => n + (ikutStatus.find((r) => r.status === s)?._count._all ?? 0), 0);
  const jumlahSemua = ikutStatus.reduce((n, r) => n + r._count._all, 0);
  const bilHalaman = Math.max(1, Math.ceil(jumlah / SAIZ_HALAMAN));
  const semasa: Carian = { status: kumpulan, q, sumber };

  const chip = (label: string, kunci: string, n: number) => {
    const aktif = kumpulan === kunci;
    return (
      <Link
        key={kunci || "all"}
        href={urlDengan(semasa, { status: kunci, page: "" })}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
          aktif ? "bg-[#0B2A1F] text-white" : "bg-white text-black/60 border border-black/[0.08] hover:bg-black/[0.03]"
        }`}
      >
        {label}
        <span className={`text-[11px] ${aktif ? "text-white/60" : "text-black/35"}`}>{n}</span>
      </Link>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {kumpulan ? KUMPULAN_STATUS[kumpulan].label : "All Land"}
          </h1>
          <p className="text-sm text-black/50 mt-0.5">
            {jumlah} {jumlah === 1 ? "listing" : "listings"}
            {q && (
              <>
                {" "}matching <strong>&ldquo;{q}&rdquo;</strong> ·{" "}
                <Link href={urlDengan(semasa, { q: "", page: "" })} className="underline">
                  clear search
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href="/geran/admin/tambah"
          className="inline-flex items-center gap-1.5 h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={16} /> Add Land
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chip("All", "", jumlahSemua)}
          {Object.entries(KUMPULAN_STATUS).map(([k, v]) => chip(v.label, k, kiraKumpulan(k)))}
        </div>
        <form action="/geran/admin/geran" className="ml-auto flex items-center gap-2">
          {kumpulan && <input type="hidden" name="status" value={kumpulan} />}
          <select
            name="sumber"
            defaultValue={sumber}
            className="h-9 rounded-lg border border-black/[0.1] bg-white px-2.5 text-sm"
            aria-label="Source"
          >
            <option value="">All sources</option>
            {SUMBER.map((s) => (
              <option key={s} value={s}>
                {SUMBER_GERAN_LABEL[s]}
              </option>
            ))}
          </select>
          <label className="relative">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search..."
              className="h-9 w-44 rounded-lg border border-black/[0.1] bg-white pl-3 pr-8 text-sm outline-none focus:border-emerald-600/50"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/35" />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-black/[0.06] px-3 text-sm font-semibold hover:bg-black/[0.09]">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-xs text-black/45 border-b border-black/[0.06] bg-[#FAFBFA]">
                <th className="font-medium px-5 py-3">Land</th>
                <th className="font-medium px-3 py-3">Location</th>
                <th className="font-medium px-3 py-3">Price</th>
                <th className="font-medium px-3 py-3">Lots</th>
                <th className="font-medium px-3 py-3">Status</th>
                <th className="font-medium px-3 py-3">Source</th>
                <th className="font-medium px-3 py-3">Updated</th>
                <th className="font-medium px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const harga = g.hargaSiaranSen ?? g.hargaDimintaSen;
                return (
                  <tr key={g.id} className="border-b border-black/[0.04] last:border-0 hover:bg-[#FAFBFA]">
                    <td className="px-5 py-3">
                      <Link href={`/geran/admin/geran/${g.id}`} className="flex items-center gap-3 group">
                        <span className="relative w-14 h-10 rounded-md overflow-hidden bg-[#EEF1EF] shrink-0">
                          {g.gambarUrls[0] && (
                            <Image src={g.gambarUrls[0]} alt="" fill sizes="56px" className="object-cover" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold truncate max-w-[280px] group-hover:underline">{g.tajuk}</span>
                          <span className="block text-xs text-black/45">
                            #{g.seq}
                            {g.nomborLot ? ` · Lot ${g.nomborLot}` : ""} · {formatKeluasan(g.keluasan, g.unitKeluasan)}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-black/65">
                      <span className="block whitespace-nowrap">{g.daerahMukim}</span>
                      <span className="block text-xs text-black/40">{g.negeri}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-semibold tabular-nums">{harga === null ? "—" : formatRM(Number(harga))}</span>
                      {g.hargaSiaranSen === null && harga !== null && (
                        <span className="block text-[11px] text-black/40">asking</span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-black/60">{g._count.lots || "—"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="px-3 py-3 text-black/60 whitespace-nowrap">{SUMBER_GERAN_LABEL[g.sumber]}</td>
                    <td className="px-3 py-3 text-black/55 whitespace-nowrap">{formatTarikh(g.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/geran/admin/geran/${g.id}`}
                          aria-label={`Edit #${g.seq}`}
                          className="p-1.5 rounded-md text-black/50 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Pencil size={15} />
                        </Link>
                        <Link
                          href={
                            STATUS_BUTIRAN_AWAM.includes(g.status) ? `/geran/${g.id}` : `/geran/${g.id}?preview=1`
                          }
                          target="_blank"
                          aria-label={`View #${g.seq}`}
                          className="p-1.5 rounded-md text-black/50 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-black/45">
                    No listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bilHalaman > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-black/50">
            Page {halaman} of {bilHalaman}
          </span>
          <div className="flex gap-2">
            {halaman > 1 && (
              <Link
                href={urlDengan(semasa, { page: String(halaman - 1) })}
                className="rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 font-semibold hover:bg-black/[0.03]"
              >
                ← Previous
              </Link>
            )}
            {halaman < bilHalaman && (
              <Link
                href={urlDengan(semasa, { page: String(halaman + 1) })}
                className="rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 font-semibold hover:bg-black/[0.03]"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
