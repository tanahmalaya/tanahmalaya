import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isGeranHostname } from "@/lib/geran-domain";

const BASE_URL = "https://tanahmalaya.org";
const GERAN_BASE_URL = "https://gerantanah.com";

// GERAN ialah produk berasingan pada domain sendiri (lihat middleware.ts) -
// sitemap dia kena senaraikan penyenaraian geran dengan URL gerantanah.com,
// bukan disatukan dengan sitemap utama tanahmalaya.org.
async function geranSitemap(): Promise<MetadataRoute.Sitemap> {
  const gerans = await prisma.geran.findMany({
    where: { status: "DISAHKAN" },
    select: { id: true, updatedAt: true },
  });

  const listingRoutes: MetadataRoute.Sitemap = gerans.map((g) => ({
    url: `${GERAN_BASE_URL}/${g.id}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: `${GERAN_BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${GERAN_BASE_URL}/geran/privasi`, changeFrequency: "yearly", priority: 0.3 },
    ...listingRoutes,
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostname = (headers().get("host") || "").split(":")[0];
  if (isGeranHostname(hostname)) {
    return geranSitemap();
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/tentang-kami`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/keahlian`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/kelas-tanah`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/merchandise`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/aktiviti`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/hubungi-kami`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terma-perkhidmatan`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [products, classes] = await Promise.all([
    prisma.product.findMany({ where: { aktif: true }, select: { id: true, updatedAt: true } }),
    prisma.landClass.findMany({ select: { id: true, tarikh: true } }),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/merchandise/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const classRoutes: MetadataRoute.Sitemap = classes.map((k) => ({
    url: `${BASE_URL}/kelas-tanah/${k.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...classRoutes];
}
