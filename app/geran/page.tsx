export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GeranDirectory, { type GeranListing } from "@/components/geran/GeranDirectory";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import { GERAN_BTN_PRIMARY_INLINE } from "@/components/geran/theme";

export const metadata = {
  title: "Geran - Direktori Tanah Bergeran Untuk Dijual",
  description:
    "Cari & tapis tanah bergeran (hakmilik jelas) yang disenaraikan untuk dijual di seluruh Malaysia. Setiap penyenaraian disemak & disahkan PLT dahulu.",
  alternates: { canonical: "/geran" },
};

export default async function GeranPage() {
  const gerans = await prisma.geran.findMany({
    where: { status: "DISAHKAN" },
    orderBy: { createdAt: "desc" },
  });

  const listings: GeranListing[] = gerans.map((g) => ({
    id: g.id,
    seq: g.seq,
    tajuk: g.tajuk,
    negeri: g.negeri,
    daerahMukim: g.daerahMukim,
    nomborLot: g.nomborLot,
    jenisTanah: g.jenisTanah,
    jenisHakmilik: g.jenisHakmilik,
    keluasan: g.keluasan,
    unitKeluasan: g.unitKeluasan,
    hargaSen: Number(g.hargaSen),
    keterangan: g.keterangan,
    gambarUrls: g.gambarUrls,
  }));

  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader
        action={
          <Link href="/geran/jual" className={GERAN_BTN_PRIMARY_INLINE}>
            + Jual Tanah Anda
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E]">
            Cari Tanah Bergeran
          </h1>
          <p className="text-[#0E3B2E]/55 text-[15px] mt-1 max-w-xl">
            Direktori tanah bergeran (hakmilik jelas) untuk dijual — setiap penyenaraian disemak &amp;
            disahkan dahulu.
          </p>
        </div>
        <GeranDirectory listings={listings} />
      </div>

      <GeranFooter />
    </div>
  );
}
