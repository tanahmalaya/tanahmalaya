"use client";

// Rangka admin LANDHUB: sidebar (desktop tetap, mobile laci) + top bar dengan
// carian. Menu datang dari lib/geran/admin-nav.ts; layout pelayan hantar
// kiraan lencana & nama admin sahaja supaya komponen ni tak sentuh DB.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  Briefcase,
  ChevronDown,
  ChartColumn,
  FileText,
  Images,
  LandPlot,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Search,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import GeranLogo from "@/components/geran/GeranLogo";
import {
  LANDHUB_NAV,
  type LandhubCounts,
  type LandhubIcon,
  type LandhubNavItem,
} from "@/lib/geran/admin-nav";

const IKON: Record<LandhubIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  land: LandPlot,
  map: MapIcon,
  media: Images,
  prospects: Users,
  consultants: Briefcase,
  documents: FileText,
  transactions: ArrowLeftRight,
  reports: ChartColumn,
  settings: Settings,
};

// Warna lencana ikut maksud: kuning = perlu tindakan, hijau = aktif, kelabu = arkib.
const WARNA_LENCANA: Record<keyof LandhubCounts, string> = {
  pending: "bg-amber-400 text-amber-950",
  active: "bg-emerald-400 text-emerald-950",
  sold: "bg-white/15 text-white/80",
};

// href anak menu mengandungi ?status=..., jadi padanan aktif kena banding
// pathname DAN parameter status - pathname sahaja akan nyalakan semua anak.
function hrefAktif(href: string, pathname: string, status: string | null): boolean {
  const [path, query] = href.split("?");
  if (path !== pathname) return false;
  const statusHref = query ? new URLSearchParams(query).get("status") : null;
  return statusHref === status;
}

function itemAktif(item: LandhubNavItem, pathname: string): boolean {
  if (item.href === "/geran/admin") return pathname === "/geran/admin";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavList({ counts, onNavigate }: { counts: LandhubCounts; onNavigate?: () => void }) {
  const pathname = usePathname();
  const status = useSearchParams().get("status");
  const [terbuka, setTerbuka] = useState<Set<string>>(
    () => new Set(LANDHUB_NAV.filter((i) => i.children && itemAktif(i, pathname)).map((i) => i.href))
  );

  // Buka kumpulan secara automatik bila admin sampai ke dalamnya melalui
  // pautan lain (cth. kad dashboard), tanpa menutup kumpulan yang dia buka.
  useEffect(() => {
    const aktif = LANDHUB_NAV.find((i) => i.children && itemAktif(i, pathname));
    if (aktif) setTerbuka((prev) => (prev.has(aktif.href) ? prev : new Set(prev).add(aktif.href)));
  }, [pathname]);

  function togol(href: string) {
    setTerbuka((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 text-[13.5px]">
      {LANDHUB_NAV.map((item) => {
        const Ikon = IKON[item.icon];
        const aktif = itemAktif(item, pathname);

        if (!item.children) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                aktif ? "bg-emerald-500/15 text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Ikon size={17} strokeWidth={aktif ? 2.2 : 1.8} className={aktif ? "text-emerald-300" : ""} />
              {item.label}
            </Link>
          );
        }

        const buka = terbuka.has(item.href);
        return (
          <div key={item.href}>
            <button
              type="button"
              onClick={() => togol(item.href)}
              aria-expanded={buka}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                aktif ? "text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Ikon size={17} strokeWidth={aktif ? 2.2 : 1.8} className={aktif ? "text-emerald-300" : ""} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown size={15} className={`text-white/40 transition-transform ${buka ? "" : "-rotate-90"}`} />
            </button>
            {buka && (
              <div className="ml-[22px] border-l border-white/10 pl-3 my-1 space-y-0.5">
                {item.children.map((child) => {
                  const anakAktif = hrefAktif(child.href, pathname, status);
                  const kiraan = child.countKey ? counts[child.countKey] : 0;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                        anakAktif
                          ? "bg-emerald-500/15 text-white font-semibold"
                          : "text-white/55 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {child.label}
                      {child.countKey && kiraan > 0 && (
                        <span
                          className={`min-w-[20px] text-center rounded-full px-1.5 text-[10.5px] font-bold leading-[18px] ${
                            WARNA_LENCANA[child.countKey]
                          }`}
                        >
                          {kiraan}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Sidebar({ counts, onNavigate }: { counts: LandhubCounts; onNavigate?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#0B2A1F] text-white">
      <Link href="/geran/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.07]">
        <GeranLogo size={32} />
        <span className="leading-tight">
          <span className="block font-display font-extrabold tracking-wide text-[15px]">LANDHUB</span>
          <span className="block text-[9.5px] uppercase tracking-[0.14em] text-white/45">Land Management System</span>
        </span>
      </Link>

      <Suspense fallback={<div className="flex-1" />}>
        <NavList counts={counts} onNavigate={onNavigate} />
      </Suspense>

      <form action="/api/geran-admin/logout" method="POST" className="px-3 py-3 border-t border-white/[0.07]">
        <button
          type="submit"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-white/55 hover:text-red-300 hover:bg-white/5"
        >
          <LogOut size={17} strokeWidth={1.8} />
          Log Out
        </button>
      </form>
    </div>
  );
}

function CarianTopbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        router.push(t ? `/geran/admin/geran?q=${encodeURIComponent(t)}` : "/geran/admin/geran");
      }}
      className="flex-1 max-w-xl"
    >
      <label className="relative block">
        <span className="sr-only">Search land</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search land, lot, location, owner..."
          className="w-full h-10 rounded-lg border border-black/[0.08] bg-[#F4F6F5] pl-3.5 pr-10 text-sm text-[#0E2A20] placeholder-black/35 outline-none focus:border-emerald-600/50 focus:ring-2 focus:ring-emerald-600/15"
        />
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35" />
      </label>
    </form>
  );
}

export default function LandhubShell({
  counts,
  adminName,
  children,
}: {
  counts: LandhubCounts;
  adminName: string;
  children: React.ReactNode;
}) {
  const [lacibuka, setLaciBuka] = useState(false);
  const pathname = usePathname();

  // Tutup laci mobile bila halaman bertukar (cth. butang "Back" pelayar).
  useEffect(() => setLaciBuka(false), [pathname]);

  const inisial = adminName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0E2A20]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <Sidebar counts={counts} />
      </aside>

      {lacibuka && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setLaciBuka(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar counts={counts} onNavigate={() => setLaciBuka(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-black/[0.06] flex items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setLaciBuka(true)}
            aria-label="Open menu"
            className="lg:hidden -ml-1 p-2 rounded-md hover:bg-black/5"
          >
            <Menu size={20} />
          </button>
          <CarianTopbar />
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Link
              href="/geran/admin/geran?status=pending"
              aria-label={`${counts.pending} listings pending review`}
              className="relative p-2 rounded-full hover:bg-black/5"
            >
              <Bell size={19} />
              {counts.pending > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center">
                  {counts.pending > 99 ? "99+" : counts.pending}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                {inisial || "A"}
              </span>
              <span className="hidden sm:block leading-tight">
                <span className="block text-sm font-semibold">{adminName}</span>
                <span className="block text-[11px] text-black/45">Administrator</span>
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Butang tutup yang jelas di luar laci - lebih mudah dicapai di telefon
          daripada mengetik latar gelap. */}
      {lacibuka && (
        <button
          type="button"
          onClick={() => setLaciBuka(false)}
          aria-label="Close menu"
          className="lg:hidden fixed top-3 right-3 z-[60] p-2 rounded-full bg-white shadow"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
