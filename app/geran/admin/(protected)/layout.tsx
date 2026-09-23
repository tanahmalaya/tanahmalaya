import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import LandhubShell from "@/components/geran/admin/LandhubShell";
import { KUMPULAN_STATUS } from "@/lib/geran/status";

export const metadata = {
  title: "LANDHUB",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "GERAN",
    title: "LANDHUB — GERAN Admin",
    description: "Land management dashboard for gerantanah.com.",
    images: [{ url: "https://gerantanah.com/geran-logo-g.jpeg", alt: "GERAN" }],
  },
};

export default async function GeranAdminLayout({ children }: { children: React.ReactNode }) {
  const session = getGeranAdminSession();
  if (!session) redirect("/geran/admin/login");

  const kira = (k: string) => prisma.geran.count({ where: { status: { in: KUMPULAN_STATUS[k].statuses } } });
  const [admin, draft, pending, active, sold] = await Promise.all([
    prisma.geranAdminUser.findUnique({ where: { id: session.geranAdminId }, select: { name: true } }),
    kira("draft"),
    kira("pending"),
    kira("active"),
    kira("sold"),
  ]);
  const counts = { draft, pending, active, sold };

  return (
    <LandhubShell counts={counts} adminName={admin?.name ?? "Admin"}>
      {children}
    </LandhubShell>
  );
}
