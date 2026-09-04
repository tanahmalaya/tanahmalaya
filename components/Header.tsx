"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext"; // 1. Import useCart (laraskan path jika berbeza)

const navLinks = [
  { href: "/", label: "Utama" },
  { href: "/tentang-kami", label: "Tentang Kami" },
  { href: "/keahlian", label: "Keahlian" },
  { href: "/kelas-tanah", label: "Program & Kelas" },
  { href: "/merchandise", label: "Merchandise" },
  { href: "/aktiviti", label: "Aktiviti" },
  { href: "/banjir", label: "Semak Banjir" },
  { href: "/hubungi-kami", label: "Hubungi Kami" },
];

// Dipaparkan sebagai ikon sahaja pada nav desktop (elak nav jadi padat);
// tetap muncul sebagai teks penuh dalam menu mobile via navLinks di atas.
const desktopIconOnlyHrefs = new Set(["/banjir"]);

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

// SVG Ikon Trolley
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// SVG Ikon Gelombang (Semak Banjir)
function WaveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M2 13c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M2 19c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  
  // 2. Ambil data cart dan kira total item
  const { cart } = useCart();
  const totalItems = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;

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
          {navLinks
            .filter((link) => !desktopIconOnlyHrefs.has(link.href))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-brand-gold active:text-brand-gold transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Ikon Semak Banjir - desktop sahaja (teks penuh tersedia dalam menu mobile) */}
          <Link
            href="/banjir"
            title="Semak Banjir"
            aria-label="Semak Banjir"
            className="hidden lg:flex p-2 text-white hover:text-brand-gold transition-colors items-center"
          >
            <WaveIcon />
          </Link>

          {/* 3. Butang Trolley (Paparan Desktop & Mobile) */}
          <Link
            href="/cart" // atau lokasi halaman borang checkout anda
            className="relative p-2 text-white hover:text-brand-gold transition-colors flex items-center"
            aria-label="Trolley Pesanan"
          >
            <CartIcon />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-brand-dark">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/keahlian"
            className="hidden sm:inline-block bg-brand-gold text-brand-dark px-5 py-2 rounded-sm text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Daftar Sekarang
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
            Daftar Sekarang
          </Link>
        </nav>
      )}
    </header>
  );
}