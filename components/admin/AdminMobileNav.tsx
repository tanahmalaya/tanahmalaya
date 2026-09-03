"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AdminMobileNav({ navItems, roleLabel }: { navItems: NavItem[]; roleLabel?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden bg-brand-dark text-white sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display font-bold">
          PLT Admin {roleLabel && <span className="text-brand-gold text-xs">({roleLabel})</span>}
        </p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 -mr-2 active:bg-white/10 rounded-md"
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-3 px-3 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-brand-gold/20 text-brand-gold" : "hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <form action="/api/admin/logout" method="POST" className="mt-2 pt-3 border-t border-white/10">
            <button type="submit" className="text-sm text-white/60 py-2 px-3">
              Log Keluar
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
