export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/sellerAuth";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";
import GeranAccountNav from "@/components/geran/GeranAccountNav";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  SUMBER_GERAN_PUBLIC_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";

export const metadata = {
  title: "Favorite Saya - GERAN",
  robots: { index: false },
};

// Seller account area only - see lib/sellerAuth.ts.
export default async function FavoritePage() {
  const seller = await requireSeller("/geran/favorite");

  const favorites = await prisma.geranFavorite.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    include: { geran: true },
  });

  const listings = favorites
    .filter((f) => f.geran.status === "DISAHKAN" && f.geran.hargaSiaranSen !== null)
    .map((f) => f.geran);

  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader
        back={<BackButton href="/geran" label="Directory" variant="light" />}
        action={<GeranAccountNav isLoggedIn redirectPath="/geran/favorite" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E] mb-1">
          ❤ My Favorite
        </h1>
        <p className="text-[#0E3B2E]/55 text-[15px] mb-6">Titled land you've saved for reference.</p>

        {listings.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-4xl mb-3">🤍</p>
            <p className="font-semibold text-[#0E3B2E]/70">No favorite saved yet</p>
            <p className="text-sm text-[#0E3B2E]/45 mt-1 mb-4">
              Click the heart icon on any listing to save it here.
            </p>
            <Link href="/geran" className="text-sm font-semibold text-[#0E3B2E] underline">
              View Geran Directory
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/geran/${l.id}`}
                className="bg-white rounded-3xl overflow-hidden border border-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-20px_rgba(14,59,46,0.35)]"
              >
                <div className="relative aspect-[4/3] bg-[#F6F4EE]">
                  {l.gambarUrls[0] && <Image src={l.gambarUrls[0]} alt={l.tajuk} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />}
                </div>
                <div className="p-4">
                  <p className="text-[12px] text-[#0E3B2E]/45 mb-1">
                    {l.daerahMukim}, {l.negeri}
                  </p>
                  <h3 className="font-display font-bold text-[15px] leading-snug mb-1.5 line-clamp-2 text-[#0E3B2E]">{l.tajuk}</h3>
                  <p className="text-[12px] text-[#0E3B2E]/50 mb-3">
                    {JENIS_TANAH_LABEL[l.jenisTanah]} · {formatKeluasan(l.keluasan, l.unitKeluasan)} ·{" "}
                    {JENIS_HAKMILIK_LABEL[l.jenisHakmilik]}
                  </p>
                  <p className="font-extrabold text-[#0E3B2E] text-lg tabular-nums">{formatRM(Number(l.hargaSiaranSen ?? 0))}</p>
                  <p className="text-[11px] text-[#0E3B2E]/40 mt-1.5">{SUMBER_GERAN_PUBLIC_LABEL[l.sumber]}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <GeranFooter />
    </div>
  );
}
