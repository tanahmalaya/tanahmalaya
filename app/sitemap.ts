import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://tanahmalaya.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
