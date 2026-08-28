export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPage() {
  requireAdminOnly();
  const ads = await prisma.ad.findMany({ orderBy: { susunan: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Urus Iklan Komuniti</h1>
      <p className="text-brand-dark/60 text-sm mb-6">
        Iklan di sini akan dipaparkan secara auto-rotate di bahagian bawah laman utama
        (cth: Roofman, JomNikah, Barang Thai).
      </p>

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Iklan</h2>
        <form action="/api/ads" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input name="namaAhli" placeholder="Nama Ahli/Perniagaan (cth: Roofman)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="pautan" placeholder="URL Pautan (cth: https://roofman.my)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambarUrl" placeholder="URL Logo/Gambar" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input name="susunan" type="number" placeholder="Urutan Paparan (0 = dahulu)" className="border border-brand-dark/20 rounded-sm p-3" />
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH IKLAN
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr><th className="p-4">Nama</th><th className="p-4">Pautan</th><th className="p-4">Urutan</th><th className="p-4">Aktif</th></tr>
          </thead>
          <tbody>
            {ads.map((a) => (
              <tr key={a.id} className="border-t border-brand-cream">
                <td className="p-4">{a.namaAhli}</td>
                <td className="p-4">{a.pautan}</td>
                <td className="p-4">{a.susunan}</td>
                <td className="p-4">{a.aktif ? "Ya" : "Tidak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
