export const revalidate = 60;

import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import ClassTable from "@/components/ClassTable";
import MembershipCTA from "@/components/MembershipCTA";
import ProductGrid from "@/components/ProductGrid";
import ActivityGrid from "@/components/ActivityGrid";
import AdCarousel from "@/components/AdCarousel";
import MerdekaBanner from "@/components/MerdekaBanner";
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

      <div className="mt-20 lg:mt-28">
        <MerdekaBanner />
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 pt-20 lg:pt-28 grid lg:grid-cols-3 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-2">
          <ClassTable />
        </div>
        <div className="lg:mt-16">
          <MembershipCTA />
        </div>
      </div>

      <div className="mt-20 lg:mt-28">
        <ProductGrid />
      </div>
      <div className="mt-20 lg:mt-28">
        <ActivityGrid />
      </div>
      <div className="mt-20 lg:mt-28 mb-20 lg:mb-28">
        <AdCarousel ads={ads} />
      </div>
    </>
  );
}