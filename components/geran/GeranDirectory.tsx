"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  SUMBER_GERAN_PUBLIC_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";
import FavoriteButton from "@/components/geran/FavoriteButton";

type JenisTanah = keyof typeof JENIS_TANAH_LABEL;
type JenisHakmilik = keyof typeof JENIS_HAKMILIK_LABEL;

export type GeranListing = {
  id: string;
  seq: number;
  tajuk: string;
  negeri: string;
  daerahMukim: string;
  nomborLot: string | null;
  jenisTanah: JenisTanah;
  jenisHakmilik: JenisHakmilik;
  keluasan: number;
  unitKeluasan: string;
  hargaSen: number;
  keterangan: string | null;
  gambarUrls: string[];
  sumber: keyof typeof SUMBER_GERAN_PUBLIC_LABEL;
};

const JENIS_CHIPS: ("ALL" | JenisTanah)[] = ["ALL", "PERTANIAN", "KOSONG", "PERUMAHAN", "KOMERSIAL", "PERINDUSTRIAN", "PEMBANGUNAN"];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LandPlaceholderIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M5 20V10l7-6 7 6v10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function GeranDirectory({
  listings,
  isLoggedIn,
  favoritedIds,
}: {
  listings: GeranListing[];
  isLoggedIn: boolean;
  favoritedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [jenisAktif, setJenisAktif] = useState<"ALL" | JenisTanah>("ALL");
  const [negeriAktif, setNegeriAktif] = useState("ALL");
  const [hargaMin, setHargaMin] = useState("");
  const [hargaMaks, setHargaMaks] = useState("");
  const [favSet, setFavSet] = useState<Set<string>>(new Set(favoritedIds));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = hargaMin.trim() ? Number(hargaMin) : null;
    const maks = hargaMaks.trim() ? Number(hargaMaks) : null;
    return listings.filter((l) => {
      if (jenisAktif !== "ALL" && l.jenisTanah !== jenisAktif) return false;
      if (negeriAktif !== "ALL" && l.negeri !== negeriAktif) return false;
      const rm = l.hargaSen / 100;
      if (min !== null && rm < min) return false;
      if (maks !== null && rm > maks) return false;
      if (q.length > 0) {
        const gabung = `${l.tajuk} ${l.negeri} ${l.daerahMukim} ${l.nomborLot ?? ""}`.toLowerCase();
        if (!gabung.includes(q)) return false;
      }
      return true;
    });
  }, [listings, query, jenisAktif, negeriAktif, hargaMin, hargaMaks]);

  function handleToggle(geranId: string, favorited: boolean) {
    setFavSet((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(geranId);
      else next.delete(geranId);
      return next;
    });
  }

  return (
    <div>
      {/* iOS-style search bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F6F4EE]/85 backdrop-blur-xl border-b border-black/5">
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0E3B2E]/35">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, state, district or lot no."
            className="w-full bg-black/[0.05] focus:bg-white border border-transparent focus:border-[#0E3B2E]/40 rounded-2xl pl-11 pr-4 py-3 text-sm placeholder-[#0E3B2E]/35 outline-none focus:ring-4 focus:ring-[#0E3B2E]/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {JENIS_CHIPS.map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenisAktif(j)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                jenisAktif === j
                  ? "bg-[#0E3B2E] text-white shadow-sm"
                  : "bg-black/[0.05] text-[#0E3B2E]/60 hover:bg-black/[0.08]"
              }`}
            >
              {j === "ALL" ? "All Types" : JENIS_TANAH_LABEL[j]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <select
            value={negeriAktif}
            onChange={(e) => setNegeriAktif(e.target.value)}
            className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-black/[0.05] text-[#0E3B2E]/60 outline-none border-none"
          >
            <option value="ALL">All States</option>
            {NEGERI_LIST.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <span className="shrink-0 w-px h-5 bg-black/10 mx-1" />

          <div className="shrink-0 flex items-center gap-1.5 bg-black/[0.05] rounded-full pl-3.5 pr-1 py-1">
            <span className="text-[13px] font-semibold text-[#0E3B2E]/45">RM</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={hargaMin}
              onChange={(e) => setHargaMin(e.target.value)}
              placeholder="Min"
              className="w-16 bg-transparent text-[13px] font-semibold text-[#0E3B2E] placeholder-[#0E3B2E]/35 outline-none py-1"
            />
          </div>
          <span className="shrink-0 text-[#0E3B2E]/30 text-xs">—</span>
          <div className="shrink-0 flex items-center gap-1.5 bg-black/[0.05] rounded-full pl-3.5 pr-1 py-1">
            <span className="text-[13px] font-semibold text-[#0E3B2E]/45">RM</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={hargaMaks}
              onChange={(e) => setHargaMaks(e.target.value)}
              placeholder="Max"
              className="w-16 bg-transparent text-[13px] font-semibold text-[#0E3B2E] placeholder-[#0E3B2E]/35 outline-none py-1"
            />
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-[#0E3B2E]/40 uppercase tracking-wide mt-4 mb-3">
        {filtered.length} results
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-semibold text-[#0E3B2E]/70">No listings found</p>
          <p className="text-sm text-[#0E3B2E]/45 mt-1">Try different filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="relative bg-white rounded-3xl overflow-hidden border border-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-20px_rgba(14,59,46,0.35)] active:scale-[0.98] transition-transform"
            >
              <FavoriteButton
                geranId={l.id}
                favorited={favSet.has(l.id)}
                isLoggedIn={isLoggedIn}
                redirectPath="/geran"
                onToggle={handleToggle}
                className="absolute top-3 right-3 z-10"
              />

              <Link href={`/geran/${l.id}`} className="block">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F6F4EE] to-black/[0.03]">
                  {l.gambarUrls[0] ? (
                    <Image src={l.gambarUrls[0]} alt={l.tajuk} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#0E3B2E]/20">
                      <LandPlaceholderIcon />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[#175C42] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    ✓ Approved
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-1 text-[12px] text-[#0E3B2E]/45 mb-1">
                    <PinIcon />
                    {l.daerahMukim}, {l.negeri}
                    <span className="ml-auto text-[11px] font-semibold text-[#0E3B2E]/50 bg-[#0E3B2E]/[0.06] px-2 py-0.5 rounded-full">
                      {JENIS_HAKMILIK_LABEL[l.jenisHakmilik]}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] leading-snug mb-1.5 line-clamp-2 text-[#0E3B2E]">{l.tajuk}</h3>
                  <p className="text-[12px] text-[#0E3B2E]/50 mb-3">
                    {JENIS_TANAH_LABEL[l.jenisTanah]} · {formatKeluasan(l.keluasan, l.unitKeluasan)}
                  </p>
                  <p className="font-extrabold text-[#0E3B2E] text-lg tabular-nums">{formatRM(l.hargaSen)}</p>
                  <p className="text-[11px] text-[#0E3B2E]/40 mt-1.5">{SUMBER_GERAN_PUBLIC_LABEL[l.sumber]}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
