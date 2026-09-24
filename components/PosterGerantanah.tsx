"use client";

import { useEffect, useState } from "react";

// Poster kecil di tepi halaman utama yang membawa pelawat ke gerantanah.com
// (marketplace tanah - kini laman berasingan, bukan sebahagian PLT). Boleh
// ditutup; pilihan tutup diingat 7 hari dalam pelayar pelawat.
const URL_GT = "https://gerantanah.com";
const LOGO_GT = "https://gerantanah.com/geran-logo-g.jpeg";
const KUNCI_TUTUP = "poster-gt-ditutup";
const TEMPOH_TUTUP_MS = 7 * 24 * 60 * 60 * 1000;

export default function PosterGerantanah() {
  const [papar, setPapar] = useState(false);

  useEffect(() => {
    let ditutupPada = 0;
    try {
      ditutupPada = Number(localStorage.getItem(KUNCI_TUTUP)) || 0;
    } catch {}
    if (Date.now() - ditutupPada < TEMPOH_TUTUP_MS) return;
    // Muncul selepas halaman siap dimuat supaya tak bersaing dengan Hero.
    const t = setTimeout(() => setPapar(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function tutup() {
    setPapar(false);
    try {
      localStorage.setItem(KUNCI_TUTUP, String(Date.now()));
    } catch {}
  }

  if (!papar) return null;

  return (
    <aside
      aria-label="GeranTanah.com - pasaran tanah Malaysia"
      className="fixed z-40 right-4 bottom-4 lg:right-6 lg:bottom-6 animate-[posterMasuk_.4s_ease-out]"
    >
      <style>{`@keyframes posterMasuk{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      <button
        type="button"
        onClick={tutup}
        aria-label="Tutup poster"
        className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white text-[#0E3B2E] shadow-md text-base leading-none flex items-center justify-center hover:bg-gray-100"
      >
        ×
      </button>

      {/* Telefon: jalur ringkas supaya tak menutup kandungan */}
      <a
        href={URL_GT}
        target="_blank"
        rel="noopener"
        className="lg:hidden flex items-center gap-2.5 bg-[#0E3B2E] text-white rounded-full pl-1.5 pr-4 py-1.5 shadow-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_GT} alt="" width={32} height={32} className="rounded-full bg-white" />
        <span className="text-sm leading-tight">
          <span className="block text-white/70 text-[11px]">Cari tanah dijual?</span>
          <span className="font-bold">gerantanah.com →</span>
        </span>
      </a>

      {/* Desktop: kad poster */}
      <a
        href={URL_GT}
        target="_blank"
        rel="noopener"
        className="hidden lg:block w-64 rounded-2xl overflow-hidden shadow-2xl text-white bg-gradient-to-br from-[#0E3B2E] to-[#175C42] group"
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_GT} alt="" width={36} height={36} className="rounded-lg bg-white" />
            <div className="leading-tight">
              <p className="font-extrabold tracking-wide text-sm">GERANTANAH.COM</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Pasaran Tanah Malaysia</p>
            </div>
          </div>

          <p className="mt-4 text-xl font-bold leading-snug">Sedang mencari tanah?</p>
          <p className="mt-1 text-sm text-white/75">Tanah bergeran untuk dijual di seluruh Malaysia.</p>

          <ul className="mt-3 space-y-1 text-[13px] text-white/85">
            <li>✓ Geran jelas &amp; disemak</li>
            <li>✓ Peta lot &amp; pandangan 360°</li>
          </ul>
        </div>

        <div className="bg-white text-[#0E3B2E] px-5 py-3 flex items-center justify-between font-bold text-sm">
          Layari gerantanah.com
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </a>
    </aside>
  );
}
