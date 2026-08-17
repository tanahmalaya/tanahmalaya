export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AdminClassesPage() {
  const classes = await prisma.landClass.findMany({ orderBy: { tarikh: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Urus Kelas Tanah</h1>

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Kelas Baharu</h2>
        <form action="/api/classes" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input type="date" name="tarikh" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="namaKelas" placeholder="Nama Kelas (cth: Kelas Asas 1)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="topik" placeholder="Topik" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input name="lokasi" placeholder="Lokasi" required className="border border-brand-dark/20 rounded-sm p-3" />
          <select name="status" className="border border-brand-dark/20 rounded-sm p-3">
            <option value="TERBUKA">Terbuka</option>
            <option value="PENUH">Penuh</option>
            <option value="TAMAT">Tamat</option>
          </select>
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH KELAS
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr><th className="p-4">Tarikh</th><th className="p-4">Kelas</th><th className="p-4">Topik</th><th className="p-4">Lokasi</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody>
            {classes.map((k) => (
              <tr key={k.id} className="border-t border-brand-cream">
                <td className="p-4">{k.tarikh.toLocaleDateString("ms-MY")}</td>
                <td className="p-4">{k.namaKelas}</td>
                <td className="p-4">{k.topik}</td>
                <td className="p-4">{k.lokasi}</td>
                <td className="p-4">{k.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
