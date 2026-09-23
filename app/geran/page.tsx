export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { STATUS_DIREKTORI } from "@/lib/geran/status";
import { getSellerSession } from "@/lib/sellerAuth";
import GeranDirectory, { type GeranListing } from "@/components/geran/GeranDirectory";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";
import GeranAccountNav from "@/components/geran/GeranAccountNav";
import GeranAbout from "@/components/geran/GeranAbout";
import { isGeranDomainRequest } from "@/lib/geran/is-request";

const GERAN_TITLE = "Geran - Titled Land Directory For Sale";
const GERAN_DESCRIPTION =
  "Malaysia's marketplace for titled land with clear ownership. Search & filter land for sale, or list your own - every listing is reviewed & verified by GT first.";

export const metadata = {
  // absolute supaya tak jadi "… For Sale | GERAN" - tajuk ni dah ada "Geran".
  title: { absolute: GERAN_TITLE },
  description: GERAN_DESCRIPTION,
  // Absolute (bukan relatif) sebab metadataBase root layout ialah
  // tanahmalaya.org - GERAN kena canonical ke domain sendiri, gerantanah.com,
  // supaya Google tak anggap /geran duplicate content bawah tanahmalaya.org.
  alternates: { canonical: "https://gerantanah.com" },
  // openGraph/twitter tak diwarisi dari root layout secara automatik bila
  // ditakrifkan di sini - kalau tak set, WhatsApp/FB link preview untuk
  // gerantanah.com akan terus papar jenama tanahmalaya.org dari root layout.
  openGraph: {
    type: "website",
    url: "https://gerantanah.com",
    siteName: "GERAN",
    title: GERAN_TITLE,
    description: GERAN_DESCRIPTION,
    images: [{ url: "https://gerantanah.com/geran-logo-g.jpeg", alt: "GERAN" }],
  },
  twitter: {
    card: "summary",
    title: GERAN_TITLE,
    description: GERAN_DESCRIPTION,
    images: ["https://gerantanah.com/geran-logo-g.jpeg"],
  },
};

export default async function GeranPage() {
  const session = getSellerSession();
  // gerantanah.com ialah laman berasingan - tiada "Home" balik ke
  // tanahmalaya.org. Butang ni kekal untuk tanahmalaya.org/geran.
  const showHomeButton = !isGeranDomainRequest();

  const [gerans, favorites] = await Promise.all([
    prisma.geran.findMany({
      // hargaSiaranSen wajib ada sebelum status jadi PUBLISHED, tapi tapis
      // sekali lagi di sini supaya direktori tak sesekali papar harga kosong.
      where: { status: { in: STATUS_DIREKTORI }, hargaSiaranSen: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
    session
      ? prisma.geranFavorite.findMany({ where: { sellerId: session.sellerId }, select: { geranId: true } })
      : Promise.resolve([]),
  ]);

  const listings: GeranListing[] = gerans.map((g) => ({
    id: g.id,
    seq: g.seq,
    tajuk: g.tajuk,
    negeri: g.negeri,
    daerahMukim: g.daerahMukim,
    nomborLot: g.nomborLot,
    jenisTanah: g.jenisTanah,
    jenisHakmilik: g.jenisHakmilik,
    statusPemilikan: g.statusPemilikan,
    keluasan: g.keluasan,
    unitKeluasan: g.unitKeluasan,
    hargaSen: Number(g.hargaSiaranSen),
    keterangan: g.keterangan,
    gambarUrls: g.gambarUrls,
    sumber: g.sumber,
    reserved: g.status === "RESERVED",
  }));

  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader
        back={showHomeButton ? <BackButton href="/" label="Home" variant="light" /> : undefined}
        action={<GeranAccountNav isLoggedIn={!!session} redirectPath="/geran" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E]">
            Find Titled Land
          </h1>
          <p className="text-[#0E3B2E]/55 text-[15px] mt-1 max-w-2xl leading-relaxed">
            Malaysia&apos;s marketplace for land with a proper title and clear ownership. Browse what is for
            sale, or list your own land — every listing is reviewed and verified by GT first.
          </p>
        </div>
        <GeranDirectory
          listings={listings}
          isLoggedIn={!!session}
          favoritedIds={favorites.map((f) => f.geranId)}
        />

        <GeranAbout isLoggedIn={!!session} />
      </div>

      <GeranFooter />
    </div>
  );
}
