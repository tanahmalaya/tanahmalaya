export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import GeranImageGallery from "@/components/geran/GeranImageGallery";
import Paparan360, { type LotAwam360, type SceneAwam } from "@/components/geran/panorama/Paparan360";
import { bacaHotspot } from "@/lib/geran/panorama";
import { JENIS_DOKUMEN, formatSaiz } from "@/lib/geran/dokumen";
import GeranDetailActions from "@/components/geran/GeranDetailActions";
import BackButton from "@/components/BackButton";
import GeranAccountNav from "@/components/geran/GeranAccountNav";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_PEMILIKAN_LABEL,
  STATUS_PEMILIKAN_NOTA,
  SUMBER_GERAN_PUBLIC_LABEL,
  formatRM,
  formatKeluasan,
} from "@/lib/geran";
import { penandaAwam } from "@/lib/geran/penanda";
import { STATUS_BUTIRAN_AWAM, STATUS_DIREKTORI, STATUS_INFO } from "@/lib/geran/status";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id }, include: { lots: true } });
  if (!geran || !STATUS_BUTIRAN_AWAM.includes(geran.status) || geran.hargaSiaranSen === null) {
    return { title: "Geran", robots: { index: false, follow: false } };
  }

  // Medan SEO dari tab SEO editor LANDHUB; kosong = jana dari tajuk/keterangan.
  const title = geran.seoTitle || `${geran.tajuk} - GERAN`;
  const description =
    geran.seoDescription ||
    geran.keterangan?.slice(0, 160) ||
    `${geran.tajuk}, ${geran.daerahMukim}, ${geran.negeri}`;
  // Bila ada sempadan dilukis, hantar pengikis pautan ke versi yang sudah
  // dibakar - WhatsApp/FB hanya muat turun satu fail gambar dan tak akan
  // menjalankan overlay SVG kita. Tanpa polygon, guna terus URL blob supaya
  // tiada kerja pelayan langsung.
  const adaSempadan = Object.values(penandaAwam(geran, geran.lots, formatRM)).some((e) =>
    e.ciri.some((c) => c.bentuk === "poligon")
  );
  const image = adaSempadan
    ? `https://gerantanah.com/api/geran/og/${geran.id}`
    : geran.gambarUrls[0] || "https://gerantanah.com/geran-logo-g.jpeg";
  const url = `https://gerantanah.com/${geran.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "GERAN",
      title,
      description,
      images: [adaSempadan ? { url: image, width: 1200, height: 630 } : { url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function GeranDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { preview?: string };
}) {
  const geran = await prisma.geran.findUnique({
    where: { id: params.id },
    include: {
      lots: { orderBy: { susunan: "asc" } },
      panorama: { orderBy: { susunan: "asc" } },
      // Hanya dokumen untuk pembeli/awam, dan TANPA url - fail dibuka melalui
      // /api/geran/dokumen/[id] yang menyemak akses sekali lagi.
      dokumen: {
        where: { akses: { in: ["PUBLIC", "BUYER"] } },
        orderBy: { susunan: "asc" },
        select: { id: true, jenis: true, nama: true, saizBait: true, akses: true },
      },
    },
  });
  if (!geran) notFound();

  // ?preview=1 dari butang "Preview" dalam editor LANDHUB - admin boleh lihat
  // draf/penyenaraian belum tersiar persis seperti pembeli akan nampak.
  // Pelawat biasa tetap dapat 404 walaupun meneka parameter ini.
  const pratonton = searchParams.preview === "1" && !!getGeranAdminSession();
  const awam = STATUS_BUTIRAN_AWAM.includes(geran.status) && geran.hargaSiaranSen !== null;
  if (!awam && !pratonton) notFound();

  const session = getSellerSession();
  const detailPath = `/geran/`;
  const penanda = penandaAwam(geran, geran.lots, formatRM);
  const scenes: SceneAwam[] = geran.panorama.map((p) => ({
    id: p.id,
    url: p.url,
    tajuk: p.tajuk,
    yawAwal: p.yawAwal,
    hotspots: bacaHotspot(p.hotspots),
  }));
  // Hanya maklumat lot yang memang awam - harga disembunyi untuk lot Sold,
  // sama seperti overlay gambar (lib/geran/penanda.ts).
  const lot360: Record<string, LotAwam360> = Object.fromEntries(
    geran.lots.map((l) => [
      l.id,
      {
        noLot: l.noLot,
        status: l.status,
        keluasan: l.keluasan ? formatKeluasan(l.keluasan, l.unitKeluasan) : null,
        harga: l.status !== "SOLD" && l.hargaSen ? formatRM(Number(l.hargaSen)) : null,
      },
    ])
  );

  const [favorite, serupa] = await Promise.all([
    session
      ? prisma.geranFavorite.findUnique({
          where: { sellerId_geranId: { sellerId: session.sellerId, geranId: geran.id } },
        })
      : Promise.resolve(null),
    prisma.geran.findMany({
      where: {
        status: { in: STATUS_DIREKTORI },
        hargaSiaranSen: { not: null },
        id: { not: geran.id },
        OR: [{ negeri: geran.negeri }, { jenisTanah: geran.jenisTanah }],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader
        back={<BackButton href="/geran" label="Directory" variant="light" />}
        action={<GeranAccountNav isLoggedIn={!!session} redirectPath={detailPath} />}
      />

      {pratonton && (
        <div className="bg-amber-400 text-amber-950 text-sm font-semibold text-center px-4 py-2">
          Admin preview · Status: {STATUS_INFO[geran.status].label}
          {awam ? "" : " — not visible to the public"}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <GeranImageGallery gambarUrls={geran.gambarUrls} tajuk={geran.tajuk} penanda={penanda} />

        {scenes.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-[#0E3B2E] mb-2">360° View</h2>
            <Paparan360 scenes={scenes} lots={lot360} />
            <p className="text-xs text-[#0E3B2E]/40 mt-2">Drag to look around. Tap a marker for details.</p>
          </section>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="text-[13px] text-[#0E3B2E]/50 mb-1">
                {geran.daerahMukim}, {geran.negeri}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0E3B2E] tracking-tight mb-2">
                {geran.tajuk}
              </h1>
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="font-extrabold text-2xl text-[#0E3B2E] tabular-nums">
                  {geran.hargaSiaranSen === null ? "Price not set" : formatRM(Number(geran.hargaSiaranSen))}
                </p>
                {(geran.status === "RESERVED" || geran.status === "SOLD") && (
                  <span
                    className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ring-1 ring-inset ${
                      STATUS_INFO[geran.status].badge
                    }`}
                  >
                    {STATUS_INFO[geran.status].label}
                  </span>
                )}
              </div>
              <span className="inline-block mt-2 text-[12px] font-semibold text-[#0E3B2E]/60 bg-[#0E3B2E]/[0.06] px-2.5 py-1 rounded-full">
                {SUMBER_GERAN_PUBLIC_LABEL[geran.sumber]}
              </span>
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
                <dt className="text-[#0E3B2E]/45">Ownership</dt>
                <dd className="text-[#0E3B2E] font-semibold">
                  {STATUS_PEMILIKAN_LABEL[geran.statusPemilikan]}
                </dd>
              </dl>
              {/* Status pemilikan menentukan sama ada pembeli LAYAK membeli
                  langsung, bukan sekadar mempengaruhi harga - jadi maksudnya
                  dieja terus di sini dan bukan disembunyikan di sebalik istilah. */}
              <p className="text-xs text-[#0E3B2E]/55 mt-3 bg-[#0E3B2E]/[0.04] rounded-lg px-3 py-2">
                {STATUS_PEMILIKAN_NOTA[geran.statusPemilikan]}
              </p>
              <p className="text-xs text-[#0E3B2E]/40 mt-3">
                Information is based on the details submitted for this listing, reviewed by GT before
                publishing. Please verify the actual title details before any transaction.
              </p>
            </div>

            {geran.dokumen.length > 0 && (
              <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
                <h2 className="font-bold text-[#0E3B2E] mb-3">Documents</h2>
                <ul className="space-y-2">
                  {geran.dokumen.map((d) => {
                    const boleh = d.akses === "PUBLIC" || !!session;
                    return (
                      <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block font-semibold text-[#0E3B2E] truncate">{JENIS_DOKUMEN[d.jenis]}</span>
                          <span className="block text-xs text-[#0E3B2E]/45 truncate">
                            {d.nama} · {formatSaiz(d.saizBait)}
                          </span>
                        </span>
                        {boleh ? (
                          <a
                            href={`/api/geran/dokumen/${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-full border border-[#0E3B2E]/20 px-3 py-1 text-xs font-bold text-[#0E3B2E] hover:bg-[#0E3B2E]/[0.05]"
                          >
                            View
                          </a>
                        ) : (
                          <Link
                            href={`/geran/log-masuk?redirect=${encodeURIComponent(`/geran/${geran.id}`)}`}
                            className="shrink-0 rounded-full bg-[#0E3B2E] px-3 py-1 text-xs font-bold text-white"
                          >
                            Log in to view
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

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
                        <p className="text-sm font-bold text-[#0E3B2E]">{formatRM(Number(s.hargaSiaranSen ?? 0))}</p>
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
