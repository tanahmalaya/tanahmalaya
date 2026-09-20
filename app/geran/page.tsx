export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";
import GeranDirectory, { type GeranListing } from "@/components/geran/GeranDirectory";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";
import MohonRenModal, { type RenStatusInfo } from "@/components/geran/MohonRenModal";
import MohonDronePilotModal, { type DronePilotStatusInfo } from "@/components/geran/MohonDronePilotModal";
import { GERAN_BTN_PRIMARY_INLINE } from "@/components/geran/theme";
import { isGeranDomainRequest } from "@/lib/isGeranRequest";

const GERAN_TITLE = "Geran - Titled Land Directory For Sale";
const GERAN_DESCRIPTION =
  "Search & filter titled land (clear ownership) listed for sale across Malaysia. Every listing is reviewed & verified by PLT first.";

export const metadata = {
  title: GERAN_TITLE,
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

  const [gerans, favorites, seller, dronePilotApplication, renApplication] = await Promise.all([
    prisma.geran.findMany({
      where: { status: "DISAHKAN" },
      orderBy: { createdAt: "desc" },
    }),
    session
      ? prisma.geranFavorite.findMany({ where: { sellerId: session.sellerId }, select: { geranId: true } })
      : Promise.resolve([]),
    session ? prisma.seller.findUnique({ where: { id: session.sellerId } }) : Promise.resolve(null),
    session
      ? prisma.dronePilotApplication.findFirst({ where: { sellerId: session.sellerId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve(null),
    session
      ? prisma.renApplication.findFirst({ where: { sellerId: session.sellerId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve(null),
  ]);

  const renStatus: RenStatusInfo = renApplication
    ? { status: renApplication.status, catatanAdmin: renApplication.catatanAdmin }
    : null;
  const dronePilotStatus: DronePilotStatusInfo = dronePilotApplication
    ? { status: dronePilotApplication.status, catatanAdmin: dronePilotApplication.catatanAdmin }
    : null;

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
        back={showHomeButton ? <BackButton href="/" label="Home" variant="light" /> : undefined}
        action={
          <div className="flex items-center gap-4">
            {session && (
              <Link href="/geran/favorite" className="text-sm font-semibold text-[#0E3B2E]/60 hover:text-[#0E3B2E]">
                ❤ Favorite
              </Link>
            )}
            <Link href="/geran/jual" className={GERAN_BTN_PRIMARY_INLINE}>
              + List Your Land
            </Link>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E]">
            Find Titled Land
          </h1>
          <p className="text-[#0E3B2E]/55 text-[15px] mt-1 max-w-xl">
            Directory of titled land (clear ownership) for sale — every listing is reviewed &amp; verified
            first.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <MohonRenModal
              namaPenjual={seller?.fullName ?? ""}
              telefonPenjual={seller?.phone ?? ""}
              initialStatus={renStatus}
              isLoggedIn={!!session}
              redirectPath="/geran"
            />
            <MohonDronePilotModal
              namaPenjual={seller?.fullName ?? ""}
              telefonPenjual={seller?.phone ?? ""}
              initialStatus={dronePilotStatus}
              isLoggedIn={!!session}
              redirectPath="/geran"
            />
          </div>
        </div>
        <GeranDirectory
          listings={listings}
          isLoggedIn={!!session}
          favoritedIds={favorites.map((f) => f.geranId)}
        />
      </div>

      <GeranFooter />
    </div>
  );
}
