export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, CircleDollarSign, Eye, LandPlot, Pencil, Plus, Sparkles, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRM, formatKeluasan } from "@/lib/geran";
import StatusBadge from "@/components/geran/admin/StatusBadge";
import { KUMPULAN_STATUS, STATUS_GERAN, STATUS_INFO, isStatusGeran } from "@/lib/geran/status";

const infoStatus = (s: string) => (isStatusGeran(s) ? STATUS_INFO[s] : null);

const KAD = "bg-white rounded-2xl border border-black/[0.06] shadow-sm shadow-black/[0.02]";

function formatTarikh(d: Date) {
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMasaRelatif(d: Date, kini: Date) {
  const minit = Math.round((kini.getTime() - d.getTime()) / 60000);
  if (minit < 60) return `${Math.max(1, minit)}m ago`;
  const jam = Math.round(minit / 60);
  if (jam < 24) return `${jam}h ago`;
  const hari = Math.round(jam / 24);
  if (hari < 30) return `${hari}d ago`;
  return formatTarikh(d);
}

// Nilai besar dipendekkan (RM 18.4M) supaya kad statistik tak melimpah.
function formatRMRingkas(sen: number) {
  const rm = sen / 100;
  if (rm >= 1_000_000) return `RM ${(rm / 1_000_000).toFixed(1)}M`;
  if (rm >= 1_000) return `RM ${Math.round(rm / 1_000)}k`;
  return `RM ${rm.toLocaleString("en-MY")}`;
}

// Donut status - segmen dilukis sebagai lengkok stroke dengan jurang 2px
// supaya warna bersebelahan tak bercantum. Identiti tak bergantung pada warna
// sahaja: legenda di sebelah tulis label & bilangan.
function DonutStatus({ rows, jumlah }: { rows: { status: string; n: number }[]; jumlah: number }) {
  const r = 42;
  const lilitan = 2 * Math.PI * r;
  const jurang = rows.filter((x) => x.n > 0).length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <svg viewBox="0 0 110 110" className="w-36 h-36 shrink-0" role="img" aria-label={`${jumlah} listings by status`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#EEF1EF" strokeWidth="12" />
      {jumlah > 0 &&
        rows
          .filter((x) => x.n > 0)
          .map((x) => {
            const panjang = (x.n / jumlah) * lilitan;
            const el = (
              <circle
                key={x.status}
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke={infoStatus(x.status)?.hex ?? "#999"}
                strokeWidth="12"
                strokeDasharray={`${Math.max(0, panjang - jurang)} ${lilitan}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 55 55)"
              >
                <title>{`${infoStatus(x.status)?.label ?? x.status}: ${x.n}`}</title>
              </circle>
            );
            offset += panjang;
            return el;
          })}
      <text x="55" y="53" textAnchor="middle" className="fill-[#0E2A20]" style={{ font: "800 20px var(--font-body)" }}>
        {jumlah.toLocaleString("en-MY")}
      </text>
      <text x="55" y="68" textAnchor="middle" className="fill-black/45" style={{ font: "500 8px var(--font-body)" }}>
        listings
      </text>
    </svg>
  );
}

export default async function LandhubDashboardPage() {
  const kini = new Date();
  const mulaBulan = new Date(kini.getFullYear(), kini.getMonth(), 1);
  const mulaBulanLepas = new Date(kini.getFullYear(), kini.getMonth() - 1, 1);

  const [jumlah, baruBulanIni, baruBulanLepas, ikutStatus, nilai, terkini, aktiviti, ikutNegeri, jualBulanIni] =
    await Promise.all([
      prisma.geran.count(),
      prisma.geran.count({ where: { createdAt: { gte: mulaBulan } } }),
      prisma.geran.count({ where: { createdAt: { gte: mulaBulanLepas, lt: mulaBulan } } }),
      prisma.geran.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.geran.aggregate({
        where: { status: { in: KUMPULAN_STATUS.active.statuses } },
        _sum: { hargaSiaranSen: true },
      }),
      prisma.geran.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          seq: true,
          tajuk: true,
          nomborLot: true,
          negeri: true,
          daerahMukim: true,
          keluasan: true,
          unitKeluasan: true,
          hargaSiaranSen: true,
          hargaDimintaSen: true,
          gambarUrls: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.geran.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, seq: true, tajuk: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.geran.groupBy({ by: ["negeri"], _count: { _all: true }, orderBy: { _count: { negeri: "desc" } }, take: 6 }),
      prisma.geran.count({ where: { status: "SOLD", soldAt: { gte: mulaBulan } } }),
    ]);

  const kiraStatus = (s: string) => ikutStatus.find((r) => r.status === s)?._count._all ?? 0;
  const kiraKumpulan = (k: string) => KUMPULAN_STATUS[k].statuses.reduce((n, s) => n + kiraStatus(s), 0);
  const menunggu = kiraKumpulan("pending");
  const aktif = kiraKumpulan("active");
  // Semua status yang ada rekod, ikut urutan workflow - status kosong tak
  // diletak dalam legenda supaya ia tak jadi senarai sembilan baris "0".
  const statusRows = STATUS_GERAN.map((s) => ({ status: s, n: kiraStatus(s) })).filter((r) => r.n > 0);
  const nilaiSen = Number(nilai._sum?.hargaSiaranSen ?? 0);
  const perubahanBaru =
    baruBulanLepas > 0 ? Math.round(((baruBulanIni - baruBulanLepas) / baruBulanLepas) * 100) : null;
  const negeriMaks = Math.max(1, ...ikutNegeri.map((n) => n._count._all));

  const statKad = [
    {
      label: "Total Land",
      nilai: jumlah.toLocaleString("en-MY"),
      nota: `+${baruBulanIni} this month`,
      ikon: LandPlot,
      warna: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "New This Month",
      nilai: baruBulanIni.toLocaleString("en-MY"),
      nota:
        perubahanBaru === null
          ? "No listings last month"
          : `${perubahanBaru >= 0 ? "+" : ""}${perubahanBaru}% vs last month`,
      ikon: Sparkles,
      warna: "bg-sky-50 text-sky-700",
    },
    {
      label: "Sold",
      nilai: kiraStatus("SOLD").toLocaleString("en-MY"),
      nota: `${jualBulanIni} sold this month`,
      ikon: Tag,
      warna: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active Listing Value",
      nilai: formatRMRingkas(nilaiSen),
      nota: `${aktif} active listings`,
      ikon: CircleDollarSign,
      warna: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-sm text-black/50 mt-0.5">Here is a summary of your land listings and activity.</p>
        </div>
        <p className="text-sm text-black/50">
          {kini.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {menunggu > 0 && (
        <Link
          href="/geran/admin/geran?status=pending"
          className="flex items-center gap-3 mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 hover:bg-amber-100/70 transition-colors"
        >
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-sm">
            <strong>{menunggu}</strong> {menunggu === 1 ? "listing is" : "listings are"} waiting for verification
          </span>
          <span className="ml-auto text-sm font-semibold">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statKad.map((k) => (
          <div key={k.label} className={`${KAD} p-5`}>
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.warna}`}>
                <k.ikon size={19} />
              </span>
              <div>
                <p className="text-2xl font-extrabold tabular-nums leading-none">{k.nilai}</p>
                <p className="text-[13px] text-black/50 mt-1">{k.label}</p>
              </div>
            </div>
            <p className="text-xs text-black/45 mt-4 pt-3 border-t border-black/[0.05]">{k.nota}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className={`${KAD} p-5 xl:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Inventory by State</h2>
            <span className="text-xs text-black/40">Interactive lot map coming with Lots &amp; Map</span>
          </div>
          {ikutNegeri.length === 0 ? (
            <p className="text-sm text-black/45">No listings yet.</p>
          ) : (
            <ul className="space-y-3">
              {ikutNegeri.map((n) => (
                <li key={n.negeri} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm" title={`${n.negeri}: ${n._count._all}`}>
                  <span className="text-black/70 truncate">{n.negeri}</span>
                  <span className="h-2.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-emerald-600"
                      style={{ width: `${(n._count._all / negeriMaks) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{n._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${KAD} p-5`}>
          <h2 className="font-bold mb-4">Listing Status</h2>
          <div className="flex items-center gap-5">
            <DonutStatus rows={statusRows} jumlah={jumlah} />
            <ul className="flex-1 space-y-2.5 text-sm">
              {statusRows.map((r) => (
                <li key={r.status} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${infoStatus(r.status)?.dot}`} />
                  <span className="text-black/65 flex-1">{infoStatus(r.status)?.label}</span>
                  <span className="font-semibold tabular-nums">{r.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`${KAD} xl:col-span-2 overflow-hidden`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-bold">Latest Listings</h2>
            <Link href="/geran/admin/geran" className="text-sm font-semibold text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-black/45 border-y border-black/[0.05] bg-[#FAFBFA]">
                  <th className="font-medium px-5 py-2.5">Land</th>
                  <th className="font-medium px-3 py-2.5">Location</th>
                  <th className="font-medium px-3 py-2.5">Price</th>
                  <th className="font-medium px-3 py-2.5">Status</th>
                  <th className="font-medium px-3 py-2.5">Date</th>
                  <th className="font-medium px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {terkini.map((g) => {
                  const hargaSen = g.hargaSiaranSen ?? g.hargaDimintaSen;
                  return (
                    <tr key={g.id} className="border-b border-black/[0.04] last:border-0 hover:bg-[#FAFBFA]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative w-12 h-9 rounded-md overflow-hidden bg-[#EEF1EF] shrink-0">
                            {g.gambarUrls[0] && (
                              <Image src={g.gambarUrls[0]} alt="" fill sizes="48px" className="object-cover" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold truncate max-w-[240px]">{g.tajuk}</span>
                            <span className="block text-xs text-black/45">
                              #{g.seq}
                              {g.nomborLot ? ` · Lot ${g.nomborLot}` : ""} · {formatKeluasan(g.keluasan, g.unitKeluasan)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-black/65 whitespace-nowrap">
                        {g.daerahMukim}, {g.negeri}
                      </td>
                      <td className="px-3 py-3 font-semibold tabular-nums whitespace-nowrap">
                        {hargaSen === null ? "—" : formatRM(Number(hargaSen))}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-3 py-3 text-black/55 whitespace-nowrap">{formatTarikh(g.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/geran/admin/geran/${g.id}`}
                            aria-label={`Edit #${g.seq}`}
                            className="p-1.5 rounded-md text-black/50 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Pencil size={15} />
                          </Link>
                          {(g.status === "PUBLISHED" || g.status === "RESERVED" || g.status === "SOLD") && (
                            <Link
                              href={`/geran/${g.id}`}
                              target="_blank"
                              aria-label={`View #${g.seq} on site`}
                              className="p-1.5 rounded-md text-black/50 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Eye size={15} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {terkini.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-black/45">
                      No listings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${KAD} p-5`}>
            <h2 className="font-bold mb-3">Recent Activity</h2>
            <ul className="space-y-3.5">
              {aktiviti.map((a) => {
                // Tiada log audit lagi - "baru" bermaksud rekod tak pernah
                // disunting selepas dicipta (beza < 1 minit).
                const baru = a.updatedAt.getTime() - a.createdAt.getTime() < 60_000;
                return (
                  <li key={a.id} className="flex gap-3">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${infoStatus(a.status)?.dot ?? "bg-black/30"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {baru ? "New listing added" : "Listing updated"} ·{" "}
                        <span className="text-black/55">{infoStatus(a.status)?.label ?? a.status}</span>
                      </p>
                      <Link href={`/geran/admin/geran/${a.id}`} className="text-xs text-black/45 hover:underline truncate block">
                        #{a.seq} {a.tajuk}
                      </Link>
                    </div>
                    <span className="text-[11px] text-black/40 whitespace-nowrap">
                      {formatMasaRelatif(a.updatedAt, kini)}
                    </span>
                  </li>
                );
              })}
              {aktiviti.length === 0 && <li className="text-sm text-black/45">No activity yet.</li>}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br from-[#0B2A1F] via-[#11412F] to-[#1B6B48]">
            <p className="font-display text-lg font-extrabold leading-snug max-w-[220px]">
              Land today, the future tomorrow.
            </p>
            <p className="text-sm text-white/70 mt-1">Add a new land listing to your inventory.</p>
            <Link
              href="/geran/admin/tambah"
              className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-white text-[#0B2A1F] text-sm font-bold px-4 py-2 hover:bg-emerald-50"
            >
              <Plus size={16} /> Add Listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
