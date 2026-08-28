export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { getYuranKeahlianSen } from "@/lib/settings";

export default async function AdminSettingsPage() {
  requireAdminOnly();
  const yuranSen = await getYuranKeahlianSen();
  const yuranRM = (yuranSen / 100).toFixed(2);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Tetapan</h1>

      <div className="bg-white rounded-md shadow-sm p-6 max-w-md">
        <h2 className="font-semibold mb-4">Yuran Keahlian</h2>
        <form action="/api/settings" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Jumlah Yuran (RM)</label>
            <input
              type="number"
              name="yuranKeahlian"
              step="0.01"
              min="0"
              defaultValue={yuranRM}
              required
              className="w-full border border-brand-dark/20 rounded-sm p-3"
            />
          </div>
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-6 py-3 w-full">
            KEMASKINI
          </button>
        </form>
        <p className="text-xs text-brand-dark/50 mt-4">
          Jumlah ini akan terpakai untuk semua pendaftaran ahli baharu selepas dikemas kini.
          Ahli yang dah daftar sebelum ini tidak terjejas.
        </p>
      </div>
    </div>
  );
}
