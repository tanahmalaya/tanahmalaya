export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/sellerAuth";
import BackButton from "@/components/BackButton";
import GeranForm, { type GeranHistoryItem } from "@/components/geran/GeranForm";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import MohonDronePilotModal, { type DronePilotStatusInfo } from "@/components/geran/MohonDronePilotModal";
import MohonRenModal, { type RenStatusInfo } from "@/components/geran/MohonRenModal";

export const metadata = {
  title: "Jual Tanah - Senaraikan Geran",
  robots: { index: false },
};

// Kawasan akaun Penjual sahaja - lihat lib/sellerAuth.ts.
export default async function JualTanahPage() {
  const seller = await requireSeller("/geran/jual");

  const [gerans, dronePilotApplication, renApplication] = await Promise.all([
    prisma.geran.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dronePilotApplication.findFirst({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.renApplication.findFirst({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dronePilotStatus: DronePilotStatusInfo = dronePilotApplication
    ? { status: dronePilotApplication.status, catatanAdmin: dronePilotApplication.catatanAdmin }
    : null;
  const renStatus: RenStatusInfo = renApplication
    ? { status: renApplication.status, catatanAdmin: renApplication.catatanAdmin }
    : null;

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
        back={<BackButton href="/geran" label="Direktori" variant="light" />}
        action={
          <form action="/api/sellers/logout" method="POST">
            <button type="submit" className="text-[#0E3B2E]/50 hover:text-[#0E3B2E] underline text-sm">
              Log Keluar
            </button>
          </form>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-sm text-[#0E3B2E]/55">Ahli: {seller.fullName}</p>
          <div className="flex flex-wrap gap-2">
            <MohonRenModal namaPenjual={seller.fullName} telefonPenjual={seller.phone} initialStatus={renStatus} />
            <MohonDronePilotModal
              namaPenjual={seller.fullName}
              telefonPenjual={seller.phone}
              initialStatus={dronePilotStatus}
            />
          </div>
        </div>
        <GeranForm namaPenjual={seller.fullName} initialHistory={history} isRen={seller.renDisahkan} />
      </div>

      <GeranFooter />
    </div>
  );
}
