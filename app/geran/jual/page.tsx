export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/sellerAuth";
import BackButton from "@/components/BackButton";
import GeranForm, { type GeranHistoryItem } from "@/components/geran/GeranForm";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";

export const metadata = {
  title: "Sell Land - List on Geran",
  robots: { index: false },
};

// Seller account area only - see lib/sellerAuth.ts.
export default async function JualTanahPage() {
  const seller = await requireSeller("/geran/jual");

  const gerans = await prisma.geran.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });

  const history: GeranHistoryItem[] = gerans.map((g) => ({
    id: g.id,
    seq: g.seq,
    tajuk: g.tajuk,
    negeri: g.negeri,
    daerahMukim: g.daerahMukim,
    jenisTanah: g.jenisTanah,
    keluasan: g.keluasan,
    unitKeluasan: g.unitKeluasan,
    hargaSen: Number(g.hargaSen),
    mintaDroneSurvey: g.mintaDroneSurvey,
    status: g.status,
    catatanAdmin: g.catatanAdmin,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div className="bg-[#F6F4EE] min-h-screen text-[#0E3B2E]">
      <GeranBrandHeader
        back={<BackButton href="/geran" label="Directory" variant="light" />}
        action={
          <form action="/api/sellers/logout" method="POST">
            <button type="submit" className="text-[#0E3B2E]/50 hover:text-[#0E3B2E] underline text-sm">
              Log Out
            </button>
          </form>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-sm text-[#0E3B2E]/55 mb-6">Member: {seller.fullName}</p>
        <GeranForm namaPenjual={seller.fullName} initialHistory={history} isRen={seller.renDisahkan} />
      </div>

      <GeranFooter />
    </div>
  );
}
