"use client";

import { useState } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/geran/FavoriteButton";
import { GERAN_BTN_PRIMARY } from "@/components/geran/theme";

export default function GeranDetailActions({
  geranId,
  seq,
  isLoggedIn,
  initiallyFavorited,
  detailPath,
}: {
  geranId: string;
  seq: number;
  isLoggedIn: boolean;
  initiallyFavorited: boolean;
  detailPath: string;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm shadow-black/[0.04]">
      <p className="font-bold text-[#0E3B2E] mb-1">Berminat dengan tanah ini?</p>
      <p className="text-sm text-[#0E3B2E]/55 mb-4">
        Hubungi PLT untuk soalan lanjut atau susulan dengan penjual.
      </p>

      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <a href={`/hubungi-kami?ref=geran-${seq}`} className={GERAN_BTN_PRIMARY}>
            Hubungi PLT
          </a>
          <FavoriteButton
            geranId={geranId}
            favorited={favorited}
            isLoggedIn={isLoggedIn}
            redirectPath={detailPath}
            onToggle={(_, f) => setFavorited(f)}
            className="!bg-[#F6F4EE] shrink-0"
          />
        </div>
      ) : (
        <div>
          <Link href={`/geran/log-masuk?redirect=${encodeURIComponent(detailPath)}`} className={GERAN_BTN_PRIMARY}>
            Log Masuk untuk Hubungi
          </Link>
          <p className="text-xs text-[#0E3B2E]/45 mt-2">
            Daftar akaun percuma untuk hubungi PLT &amp; simpan tanah ke favorite.
          </p>
        </div>
      )}
    </div>
  );
}
