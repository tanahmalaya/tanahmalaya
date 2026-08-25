"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "UTAMA" },
  { href: "/tentang-kami", label: "TENTANG KAMI" },
  { href: "/keahlian", label: "KEAHLIAN" },
  { href: "/kelas-tanah", label: "KELAS TANAH" },
  { href: "/merchandise", label: "MERCHANDISE" },
  { href: "/aktiviti", label: "AKTIVITI" },
  { href: "/hubungi-kami", label: "HUBUNGI KAMI" },
];

function MenuIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-brand-dark text-white relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Pertubuhan Literasi Tanah"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <span className="font-display leading-tight">
            <span className="block text-xs tracking-widest text-brand-gold">PERTUBUHAN</span>
            <span className="block text-lg font-bold">LITERASI TANAH</span>
          </span>
        </Link>

        {/* Menu desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium tracking-wide">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-brand-gold active:text-brand-gold transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/keahlian"
            className="hidden sm:inline-block bg-brand-gold text-brand-dark px-5 py-2 rounded-sm text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
          >
            DAFTAR SEKARANG
          </Link>

          {/* Butang hamburger - mobile sahaja */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -mr-2 active:bg-white/10 rounded-md transition-colors"
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Menu mobile - timbul bila hamburger diklik */}
      {open && (
        <nav className="lg:hidden bg-brand-dark border-t border-white/10 px-6 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-md text-sm font-medium tracking-wide active:bg-brand-gold/20 hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/keahlian"
            onClick={() => setOpen(false)}
            className="mt-2 bg-brand-gold text-brand-dark text-center px-5 py-3 rounded-sm text-sm font-semibold active:opacity-80"
          >
            DAFTAR SEKARANG
          </Link>
        </nav>
      )}
    </header>
  );
}
