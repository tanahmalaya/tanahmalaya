"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import FavoriteButton from "@/components/geran/FavoriteButton";
import { GERAN_BTN_PRIMARY } from "@/components/geran/theme";

// Kad hubungi GT di halaman listing. Hubungan melalui WhatsApp/emel GT dari
// LANDHUB > Settings - BUKAN halaman hubungi tanahmalaya.org, kerana GERAN
// tiada kaitan dengan PLT. Pembeli perlu log masuk dulu (akaun percuma)
// supaya GT tahu siapa yang bertanya.
export default function GeranDetailActions({
  geranId,
  seq,
  tajuk,
  isLoggedIn,
  initiallyFavorited,
  detailPath,
  whatsapp,
  emel,
}: {
  geranId: string;
  seq: number;
  tajuk: string;
  isLoggedIn: boolean;
  initiallyFavorited: boolean;
  detailPath: string;
  whatsapp: string;
  emel: string;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const pautan = `https://gerantanah.com/${geranId}`;
  const mesej = `Hi GT, I'm interested in listing #${seq}: ${tajuk}\n${pautan}`;

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm shadow-black/[0.04]">
      <p className="font-bold text-[#0E3B2E] mb-1">Interested in this land?</p>
      <p className="text-sm text-[#0E3B2E]/55 mb-4">Contact GT for more details or to arrange a site visit.</p>

      {isLoggedIn ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mesej)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={GERAN_BTN_PRIMARY}
              >
                <MessageCircle size={18} /> WhatsApp GT
              </a>
            ) : (
              <a
                href={`mailto:${emel}?subject=${encodeURIComponent(`Listing #${seq}: ${tajuk}`)}&body=${encodeURIComponent(mesej)}`}
                className={GERAN_BTN_PRIMARY}
              >
                <Mail size={18} /> Email GT
              </a>
            )}
            <FavoriteButton
              geranId={geranId}
              favorited={favorited}
              isLoggedIn={isLoggedIn}
              redirectPath={detailPath}
              onToggle={(_, f) => setFavorited(f)}
              className="!bg-[#F6F4EE] shrink-0"
            />
          </div>
          {whatsapp && emel && (
            <p className="text-xs text-[#0E3B2E]/45 text-center">
              or email{" "}
              <a href={`mailto:${emel}`} className="underline">
                {emel}
              </a>
            </p>
          )}
        </div>
      ) : (
        <div>
          <Link href={`/geran/log-masuk?redirect=${encodeURIComponent(detailPath)}`} className={GERAN_BTN_PRIMARY}>
            Log In to Contact
          </Link>
          <p className="text-xs text-[#0E3B2E]/45 mt-2">
            Sign up for a free account to contact GT &amp; save land to favorites.
          </p>
        </div>
      )}
    </div>
  );
}
