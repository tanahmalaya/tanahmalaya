export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import GeranImageGallery from "@/components/geran/GeranImageGallery";
import GeranDetailActions from "@/components/geran/GeranDetailActions";
import BackButton from "@/components/BackButton";
import { JENIS_TANAH_LABEL, JENIS_HAKMILIK_LABEL, formatRM, formatKeluasan } from "@/lib/geran";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id } });
  if (!geran || geran.status !== "DISAHKAN") return { title: "Geran" };

  const title = `${geran.tajuk} - GERAN`;
  const description = geran.keterangan ?? `${geran.tajuk}, ${geran.daerahMukim}, ${geran.negeri}`;
  const image = geran.gambarUrls[0] || "https://gerantanah.com/geran-logo-g.jpeg";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: `https://gerantanah.com/${geran.id}`,
      siteName: "GERAN",
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function GeranDetailPage({ params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id } });
  if (!geran || geran.status !== "DISAHKAN") notFound();

  const session = getSellerSession();
  const detailPath = `/geran/${geran.id}`;

  const [favorite, serupa] = await Promise.all([
    session
      ? prisma.geranFavorite.findUnique({
          where: { sellerId_geranId: { sellerId: session.sellerId, geranId: geran.id } },
        })
      : Promise.resolve(null),
    prisma.geran.findMany({
      where: {
        status: "DISAHKAN",
        id: { not: geran.id },
        OR: [{ negeri: geran.negeri }, { jenisTanah: geran.jenisTanah }],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader back={<BackButton href="/geran" label="Directory" variant="light" />} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <GeranImageGallery gambarUrls={geran.gambarUrls} tajuk={geran.tajuk} />

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="text-[13px] text-[#0E3B2E]/50 mb-1">
                {geran.daerahMukim}, {geran.negeri}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0E3B2E] tracking-tight mb-2">
                {geran.tajuk}
              </h1>
              <p className="font-extrabold text-2xl text-[#0E3B2E] tabular-nums">{formatRM(Number(geran.hargaSen))}</p>
            </div>

            {geran.keterangan && (
              <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
                <h2 className="font-bold text-[#0E3B2E] mb-2">Description</h2>
                <p className="text-sm text-[#0E3B2E]/70 whitespace-pre-line leading-relaxed">{geran.keterangan}</p>
              </div>
            )}

            <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
              <h2 className="font-bold text-[#0E3B2E] mb-3">Land Details</h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-[#0E3B2E]/45">Land Size</dt>
                <dd className="text-[#0E3B2E] font-semibold">{formatKeluasan(geran.keluasan, geran.unitKeluasan)}</dd>
                <dt className="text-[#0E3B2E]/45">Land Type</dt>
                <dd className="text-[#0E3B2E] font-semibold">{JENIS_TANAH_LABEL[geran.jenisTanah]}</dd>
                {geran.nomborLot && (
                  <>
                    <dt className="text-[#0E3B2E]/45">Lot No.</dt>
                    <dd className="text-[#0E3B2E] font-semibold">{geran.nomborLot}</dd>
                  </>
                )}
                {geran.nomborGeran && (
                  <>
                    <dt className="text-[#0E3B2E]/45">Grant No.</dt>
                    <dd className="text-[#0E3B2E] font-semibold">{geran.nomborGeran}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
              <h2 className="font-bold text-[#0E3B2E] mb-3">Legal Information</h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-[#0E3B2E]/45">Title Type</dt>
                <dd className="text-[#0E3B2E] font-semibold">{JENIS_HAKMILIK_LABEL[geran.jenisHakmilik]}</dd>
                <dt className="text-[#0E3B2E]/45">Land Use</dt>
                <dd className="text-[#0E3B2E] font-semibold">{JENIS_TANAH_LABEL[geran.jenisTanah]}</dd>
              </dl>
              <p className="text-xs text-[#0E3B2E]/40 mt-3">
                Information is based on the seller's listing, reviewed by PLT before publishing. Please
                verify the actual title details before any transaction.
              </p>
            </div>

            {serupa.length > 0 && (
              <div>
                <h2 className="font-bold text-[#0E3B2E] mb-3">Similar Land</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {serupa.map((s) => (
                    <Link
                      key={s.id}
                      href={`/geran/${s.id}`}
                      className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
                    >
                      <div className="relative aspect-[4/3] bg-[#F6F4EE]">
                        {s.gambarUrls[0] && (
                          <Image src={s.gambarUrls[0]} alt={s.tajuk} fill className="object-cover" sizes="200px" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[13px] font-semibold text-[#0E3B2E] line-clamp-1">{s.tajuk}</p>
                        <p className="text-[11px] text-[#0E3B2E]/45 mb-1">{s.negeri}</p>
                        <p className="text-sm font-bold text-[#0E3B2E]">{formatRM(Number(s.hargaSen))}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="md:sticky md:top-20">
              <GeranDetailActions
                geranId={geran.id}
                seq={geran.seq}
                isLoggedIn={!!session}
                initiallyFavorited={!!favorite}
                detailPath={detailPath}
              />
            </div>
          </div>
        </div>
      </div>

      <GeranFooter />
    </div>
  );
}
