import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import LandhubShell from "@/components/geran/admin/LandhubShell";

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

  const [admin, pending, active] = await Promise.all([
    prisma.geranAdminUser.findUnique({ where: { id: session.geranAdminId }, select: { name: true } }),
    prisma.geran.count({ where: { status: { in: ["MENUNGGU_SEMAKAN", "DALAM_RUNDINGAN"] } } }),
    prisma.geran.count({ where: { status: "DISAHKAN" } }),
  ]);

  // Status SOLD belum wujud dalam enum StatusGeran sehingga migrasi workflow
  // LandHub - kiraan 0 buat masa ni.
  const counts = { pending, active, sold: 0 };

  return (
    <LandhubShell counts={counts} adminName={admin?.name ?? "Admin"}>
      {children}
    </LandhubShell>
  );
}
