export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteEntityButton from "@/components/DeleteEntityButton";

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  requireAdminOnly();
  const classes = await prisma.landClass.findMany({
    orderBy: { tarikh: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Urus Program &amp; Kelas</h1>

      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-4 mb-6">
          {searchParams.error}
        </div>
      )}

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Program/Kelas Baharu</h2>
        <form action="/api/classes" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input name="namaKelas" placeholder="Nama Program/Kelas (cth: Kelas Martial Art Asas)" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input type="date" name="tarikh" required className="border border-brand-dark/20 rounded-sm p-3" />
          <select name="jenisKelas" className="border border-brand-dark/20 rounded-sm p-3">
            <option value="OFFLINE">Offline (Bersemuka)</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
          <input name="topik" placeholder="Topik/Penerangan" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input name="lokasi" placeholder="Lokasi (cth: Dewan PLT, Kuala Lumpur)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="jadual" placeholder="Jadual (cth: Setiap Isnin & Khamis, 8-9pm)" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="maxPeserta" type="number" placeholder="Had Bilangan Peserta (kosongkan jika tiada had)" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="yuranRM" type="number" step="0.01" placeholder="Yuran (RM) - 0 jika percuma" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="picName" placeholder="Nama Person In Charge (PIC)" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="picContact" placeholder="Contact PIC (telefon/emel)" className="border border-brand-dark/20 rounded-sm p-3" />
          <select name="status" className="border border-brand-dark/20 rounded-sm p-3">
            <option value="TERBUKA">Terbuka</option>
            <option value="PENUH">Penuh</option>
            <option value="TAMAT">Tamat</option>
          </select>
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH PROGRAM/KELAS
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">Tarikh</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Jenis</th>
              <th className="p-4">Yuran</th>
              <th className="p-4">Status</th>
              <th className="p-4">Peserta</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((k) => (
              <tr key={k.id} className="border-t border-brand-cream">
                <td className="p-4 whitespace-nowrap">{k.tarikh.toLocaleDateString("ms-MY")}</td>
                <td className="p-4">{k.namaKelas}</td>
                <td className="p-4">{k.jenisKelas}</td>
                <td className="p-4">{k.yuranSen === 0 ? "Percuma" : `RM${(k.yuranSen / 100).toFixed(2)}`}</td>
                <td className="p-4">{k.status}</td>
                <td className="p-4">
                  <Link href={`/admin/classes/${k.id}/participants`} className="text-brand-gold text-xs font-bold">
                    LIHAT PESERTA
                  </Link>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/classes/${k.id}/edit`} className="text-brand-gold text-xs font-bold">
                      EDIT
                    </Link>
                    <DeleteEntityButton
                      action={`/api/classes/${k.id}/delete`}
                      confirmText={`Padam program/kelas "${k.namaKelas}"? Tindakan ini tidak boleh dibatalkan.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-brand-dark/50">
                  Tiada program/kelas lagi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
