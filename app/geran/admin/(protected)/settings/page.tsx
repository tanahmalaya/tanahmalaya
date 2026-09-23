export const dynamic = "force-dynamic";

import { bacaTetapanGT } from "@/lib/geran/tetapan";
import BorangTetapan from "@/components/geran/admin/BorangTetapan";

export default async function SettingsPage() {
  const tetapan = await bacaTetapanGT();
  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Settings</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-6">GeranTanah (GT) details used across gerantanah.com.</p>
      <BorangTetapan awal={tetapan} />
    </div>
  );
}
