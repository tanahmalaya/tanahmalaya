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
      <p className="font-bold text-[#0E3B2E] mb-1">Interested in this land?</p>
      <p className="text-sm text-[#0E3B2E]/55 mb-4">
        Contact GT for further questions or to follow up with the seller.
      </p>

      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <a href={`/hubungi-kami?ref=geran-${seq}`} className={GERAN_BTN_PRIMARY}>
            Contact GT
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
            Log In to Contact
          </Link>
          <p className="text-xs text-[#0E3B2E]/45 mt-2">
            Sign up for a free account to contact GT &amp; save land to favorite.
          </p>
        </div>
      )}
    </div>
  );
}
