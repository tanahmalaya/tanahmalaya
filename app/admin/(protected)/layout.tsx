import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebar, { type AdminNavItem } from "@/components/admin/AdminSidebar";

const adminNavItems: AdminNavItem[] = [
  { href: "/admin", label: "Ringkasan", icon: "ringkasan" },
  { href: "/admin/members", label: "Senarai Ahli", icon: "ahli" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/classes", label: "Kelas dan Program", icon: "kelas" },
  { href: "/admin/petty-cash", label: "Claim", icon: "claim" },
  { href: "/admin/activities", label: "Aktiviti", icon: "aktiviti" },
  { href: "/admin/aduan-tanah", label: "Aduan Tanah", icon: "aduan" },
  { href: "/admin/products", label: "Merchandise", icon: "merchandise" },
];

const staffNavItems: AdminNavItem[] = [{ href: "/admin/orders", label: "Pesanan", icon: "orders" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();
  if (!session) redirect("/admin/login");

  const navItems = session.role === "STAFF" ? staffNavItems : adminNavItems;
  const roleLabel = session.role === "STAFF" ? "Staff" : undefined;

  return (
    <div className="min-h-screen md:flex bg-brand-cream">
      <AdminSidebar navItems={navItems} roleLabel={roleLabel} />

      <AdminMobileNav navItems={navItems} roleLabel={roleLabel} />

      <div className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">{children}</div>
    </div>
  );
}
