export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { dataPetaLot } from "@/lib/geran/data-peta";

// Leaflet menyentuh `window`, jadi peta hanya dirender di pelayar.
const PetaLot = dynamicImport(() => import("@/components/geran/admin/peta/PetaLot"), {
  ssr: false,
  loading: () => <div className="h-[60vh] rounded-2xl bg-black/[0.05] animate-pulse" />,
});

export default async function LotMapPage() {
  const data = await dataPetaLot();
  return (
    <div className="max-w-[1600px] mx-auto">
      <p className="text-sm text-black/45">Lots &amp; Map</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Lot Map</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-5">
        Every listing and every lot drawn on the satellite map. Click a lot or pin to open its listing.
      </p>
      <PetaLot data={data} />
    </div>
  );
}
