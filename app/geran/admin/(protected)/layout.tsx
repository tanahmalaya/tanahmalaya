import { redirect } from "next/navigation";
import Link from "next/link";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";
import GeranAdminMobileNav from "@/components/geran/GeranAdminMobileNav";

const navItems = [
  { href: "/geran/admin", label: "Ringkasan" },
  { href: "/geran/admin/geran", label: "Senarai Tanah" },
];

export default function GeranAdminLayout({ children }: { children: React.ReactNode }) {
  const session = getGeranAdminSession();
  if (!session) redirect("/geran/admin/login");

  return (
    <div className="min-h-screen md:flex bg-[#F5F3EE]">
      <aside className="w-64 bg-[#0E3B2E] text-white p-6 hidden md:block">
        <p className="font-display font-extrabold text-lg mb-8">GERAN Admin</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block text-sm py-2 hover:text-emerald-300">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/geran-admin/logout" method="POST" className="mt-8 pt-4 border-t border-white/10">
          <button type="submit" className="text-sm text-white/60 hover:text-red-400">
            Log Keluar
          </button>
        </form>
      </aside>

      <GeranAdminMobileNav navItems={navItems} />

      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">{children}</div>
    </div>
  );
}
