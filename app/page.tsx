export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import ClassTable from "@/components/ClassTable";
import ProductGrid from "@/components/ProductGrid";
import ActivityGrid from "@/components/ActivityGrid";
import AdCarousel from "@/components/AdCarousel";
import SertaiKami from "@/components/SertaiKami";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const ads = await prisma.ad.findMany({
    where: { aktif: true },
    orderBy: { susunan: "asc" },
  });

  return (
    <>
      <Hero />
      <FeatureCards />

      <div className="max-w-7xl mx-auto px-6 pt-16">
        <ClassTable />
      </div>

      <ProductGrid />
      <ActivityGrid />
      <AdCarousel ads={ads} />
      <SertaiKami />
    </>
  );
}
