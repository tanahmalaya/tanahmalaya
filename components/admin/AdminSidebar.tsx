"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";

export type AdminNavItem = { href: string; label: string; icon: AdminIconName };

const PIN_KEY = "admin-sidebar-pinned";

export function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

// Sidebar desktop: tertutup (ikon sahaja) secara lalai, terbuka sendiri bila
// tetikus dihalakan ke atasnya. Butang "Kunci" di bawah mengekalkannya terbuka.
export default function AdminSidebar({ navItems, roleLabel }: { navItems: AdminNavItem[]; roleLabel?: string }) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_KEY) === "1");
    } catch {}
  }, []);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    try {
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {}
  }

  const label = pinned
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100";

  return (
    // Pemegang tempat: lebar tetap supaya kandungan tak beralih bila sidebar dibuka secara hover
    <div className={`hidden md:block shrink-0 transition-[width] duration-200 print:hidden ${pinned ? "w-64" : "w-16"}`}>
      <aside
        className={`group sticky top-0 z-30 h-screen bg-brand-dark text-white flex flex-col overflow-hidden transition-[width,box-shadow] duration-200 ${
          pinned ? "w-64" : "w-16 hover:w-64 focus-within:w-64 hover:shadow-2xl focus-within:shadow-2xl"
        }`}
      >
        <Link href="/admin" className="flex items-center gap-3 px-3 py-5 border-b border-white/10">
          <Image src="/logo.png" alt="PLT" width={40} height={40} className="rounded-lg shrink-0" />
          <span className={`font-display font-bold whitespace-nowrap leading-tight transition-opacity duration-200 ${label}`}>
            PLT Admin
            {roleLabel && <span className="text-brand-gold text-xs block">({roleLabel})</span>}
          </span>
        </Link>

        <nav className="overflow-y-auto overflow-x-hidden py-4 space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 mx-2 px-[14px] py-2.5 rounded-md text-sm transition-colors ${
                  active ? "bg-brand-gold/20 text-brand-gold" : "text-white/80 hover:bg-white/5 hover:text-brand-gold"
                }`}
              >
                <AdminIcon name={item.icon} className="w-5 h-5 shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${label}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 py-3 space-y-1">
          <button
            type="button"
            onClick={togglePin}
            title={pinned ? "Auto tutup" : "Kunci terbuka"}
            className="w-[calc(100%-1rem)] flex items-center gap-3 mx-2 px-[14px] py-2.5 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            <AdminIcon name="pin" className={`w-5 h-5 shrink-0 transition-transform duration-200 ${pinned ? "rotate-180" : ""}`} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${label}`}>
              {pinned ? "Auto tutup" : "Kunci terbuka"}
            </span>
          </button>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              title="Log Keluar"
              className="w-[calc(100%-1rem)] flex items-center gap-3 mx-2 px-[14px] py-2.5 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-red-400"
            >
              <AdminIcon name="logout" className="w-5 h-5 shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${label}`}>Log Keluar</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
