export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BarChart from "@/components/admin/BarChart";
import GroupedBarChart from "@/components/admin/GroupedBarChart";

const MONTH_LABEL = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
const DAY_MS = 24 * 60 * 60 * 1000;

function lastNMonths(n: number) {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: MONTH_LABEL[start.getMonth()], start, end });
  }
  return months;
}

function lastNDays(n: number) {
  const days: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(today.getTime() - i * DAY_MS);
    const end = new Date(start.getTime() + DAY_MS);
    days.push({ label: `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}`, start, end });
  }
  return days;
}

export default async function AdminDashboard() {
  requireAdminOnly();

  const months = lastNMonths(6);
  const days = lastNDays(14);
  const monthRangeStart = months[0].start;
  const dayRangeStart = days[0].start;
  const thisMonthStart = months[months.length - 1].start;

  const [
    totalAhli,
    ahliGunaWebsite,
    ahliBaharuBulanIni,
    membersInRange,
    orderItemsInRange,
    unitTerjualKeseluruhan,
    loginEventsInRange,
    loginEvents30Hari,
    kelasCount,
    aktivitiCount,
    produkCount,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { addedManually: false } }),
    prisma.member.count({ where: { addedManually: false, joinedAt: { gte: thisMonthStart } } }),
    prisma.member.findMany({
      where: { joinedAt: { gte: monthRangeStart }, addedManually: false },
      select: { joinedAt: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { in: ["BERJAYA", "SELESAI"] }, createdAt: { gte: monthRangeStart } } },
      select: { kuantiti: true, order: { select: { createdAt: true } } },
    }),
    prisma.orderItem.aggregate({
      _sum: { kuantiti: true },
      where: { order: { status: { in: ["BERJAYA", "SELESAI"] } } },
    }),
    prisma.loginEvent.findMany({
      where: { actorType: "MEMBER", createdAt: { gte: dayRangeStart } },
      select: { actorType: true, createdAt: true },
    }),
    prisma.loginEvent.count({ where: { actorType: "MEMBER", createdAt: { gte: new Date(Date.now() - 30 * DAY_MS) } } }),
    prisma.landClass.count(),
    prisma.activity.count(),
    prisma.product.count(),
  ]);

  const pendaftaranAhliBulanan = months.map((m) => ({
    label: m.label,
    value: membersInRange.filter((mem) => mem.joinedAt >= m.start && mem.joinedAt < m.end).length,
  }));

  const merchandiseTerjualBulanan = months.map((m) => ({
    label: m.label,
    value: orderItemsInRange
      .filter((oi) => oi.order.createdAt >= m.start && oi.order.createdAt < m.end)
      .reduce((sum, oi) => sum + oi.kuantiti, 0),
  }));

  const logMasukHarian = days.map((d) => ({
    label: d.label,
    member: loginEventsInRange.filter((e) => e.createdAt >= d.start && e.createdAt < d.end).length,
  }));

  const kpiCards = [
    { label: "Jumlah Ahli", value: totalAhli, hint: `+${ahliBaharuBulanIni} bulan ini` },
    { label: "Ahli Daftar Guna Website", value: ahliGunaWebsite, hint: `${totalAhli - ahliGunaWebsite} ditambah manual` },
    { label: "Unit Merchandise Terjual", value: unitTerjualKeseluruhan._sum.kuantiti ?? 0, hint: "Sepanjang masa" },
    { label: "Log Masuk (30 Hari)", value: loginEvents30Hari, hint: "Ahli PLT" },
  ];

  const ringkasanAm = [
    { label: "Kelas & Program", value: kelasCount },
    { label: "Aktiviti", value: aktivitiCount },
    { label: "Produk Merchandise", value: produkCount },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Ringkasan Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((s) => (
          <div key={s.label} className="bg-white rounded-md shadow-sm p-6">
            <p className="text-sm text-brand-dark/60">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value.toLocaleString("en-MY")}</p>
            <p className="text-xs text-brand-dark/40 mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-md shadow-sm p-6">
          <h2 className="font-semibold mb-1">Pendaftaran Ahli Guna Website</h2>
          <p className="text-xs text-brand-dark/40 mb-4">6 bulan terakhir · tak termasuk ahli ditambah manual oleh admin</p>
          <BarChart data={pendaftaranAhliBulanan} color="#C68A2E" />
        </div>

        <div className="bg-white rounded-md shadow-sm p-6">
          <h2 className="font-semibold mb-1">Merchandise Terjual</h2>
          <p className="text-xs text-brand-dark/40 mb-4">Jumlah unit dalam order berjaya/selesai, 6 bulan terakhir</p>
          <BarChart data={merchandiseTerjualBulanan} color="#8B5A2B" />
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 lg:col-span-2">
          <h2 className="font-semibold mb-1">Log Masuk</h2>
          <p className="text-xs text-brand-dark/40 mb-4">
            14 hari terakhir · direkod mula {new Date().toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
            {" "}ke depan sahaja
          </p>
          <GroupedBarChart
            labels={logMasukHarian.map((d) => d.label)}
            series={[
              { key: "member", label: "Ahli PLT", color: "#C68A2E", values: logMasukHarian.map((d) => d.member) },
            ]}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {ringkasanAm.map((s) => (
          <div key={s.label} className="bg-white rounded-md shadow-sm p-6">
            <p className="text-sm text-brand-dark/60">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value.toLocaleString("en-MY")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
