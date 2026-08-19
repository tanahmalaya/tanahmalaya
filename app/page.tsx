export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import ClassTable from "@/components/ClassTable";
import MembershipCTA from "@/components/MembershipCTA";
import ProductGrid from "@/components/ProductGrid";
import ActivityGrid from "@/components/ActivityGrid";
import AdCarousel from "@/components/AdCarousel";
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

      <div className="max-w-7xl mx-auto px-6 pt-16 grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <ClassTable />
        </div>
        <div className="lg:mt-16">
          <MembershipCTA />
        </div>
      </div>

      <ProductGrid />
      <ActivityGrid />
      <AdCarousel ads={ads} />
    </>
  );
}