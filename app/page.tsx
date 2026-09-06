export const revalidate = 60;

import Hero from "@/components/Hero";
import WhyLiterasiTanah from "@/components/WhyLiterasiTanah";
import MembershipCTA from "@/components/MembershipCTA";
import ProductGrid from "@/components/ProductGrid";
import ActivityGrid from "@/components/ActivityGrid";
import CommunityCTA from "@/components/CommunityCTA";
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

      <div className="mt-20 lg:mt-28">
        <WhyLiterasiTanah />
      </div>

      <div className="mt-20 lg:mt-28">
        <MerdekaBanner />
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
        <MembershipCTA />
      </div>

      <div className="mt-20 lg:mt-28">
        <ProductGrid />
      </div>
      <div className="mt-20 lg:mt-28">
        <ActivityGrid title="AKTIVITI KAMI" viewAllHref="/aktiviti" />
      </div>
      <div className="mt-20 lg:mt-28">
        <AdCarousel ads={ads} />
      </div>
      <div className="mt-20 lg:mt-28 mb-20 lg:mb-28">
        <CommunityCTA />
      </div>
    </>
  );
}