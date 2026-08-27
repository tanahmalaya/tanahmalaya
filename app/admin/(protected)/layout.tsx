import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";

const adminNavItems = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/members", label: "Senarai Ahli" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/classes", label: "Kelas dan Program" },
  { href: "/admin/activities", label: "Aktiviti" },
  { href: "/admin/products", label: "Merchandise" },
  { href: "/admin/ads", label: "Iklan Komuniti" },
  { href: "/admin/settings", label: "Tetapan" },
];

const staffNavItems = [{ href: "/admin/orders", label: "Pesanan" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();
  if (!session) redirect("/admin/login");

  const navItems = session.role === "STAFF" ? staffNavItems : adminNavItems;

  return (
    <div className="min-h-screen flex bg-brand-cream">
      <aside className="w-64 bg-brand-dark text-white p-6 hidden md:block">
        <p className="font-display font-bold text-lg mb-8">
          PLT Admin {session.role === "STAFF" && <span className="text-brand-gold text-xs block">(Staff)</span>}
        </p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block text-sm py-2 hover:text-brand-gold">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="POST" className="mt-8 pt-4 border-t border-white/10">
          <button type="submit" className="text-sm text-white/60 hover:text-red-400">
            Log Keluar
          </button>
        </form>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
