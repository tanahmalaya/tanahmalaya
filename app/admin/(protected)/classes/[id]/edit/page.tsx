export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditClassPage({ params }: { params: { id: string } }) {
  requireAdminOnly();

  const kelas = await prisma.landClass.findUnique({ where: { id: params.id } });
  if (!kelas) return notFound();

  const tarikhValue = kelas.tarikh.toISOString().slice(0, 10);
  const yuranRM = (kelas.yuranSen / 100).toFixed(2);

  return (
    <div>
      <Link href="/admin/classes" className="text-sm text-brand-gold mb-4 inline-block">
        &larr; Kembali ke Senarai Program &amp; Kelas
      </Link>
      <h1 className="font-display text-2xl font-bold mb-6">Edit Program/Kelas</h1>

      <div className="bg-white rounded-md shadow-sm p-6">
        <form action={`/api/classes/${kelas.id}/update`} method="POST" className="grid sm:grid-cols-2 gap-4">
          <input
            name="namaKelas"
            defaultValue={kelas.namaKelas}
            placeholder="Nama Program/Kelas (cth: Kelas Martial Art Asas)"
            required
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />
          <input type="date" name="tarikh" defaultValue={tarikhValue} required className="border border-brand-dark/20 rounded-sm p-3" />
          <select name="jenisKelas" defaultValue={kelas.jenisKelas} className="border border-brand-dark/20 rounded-sm p-3">
            <option value="OFFLINE">Offline (Bersemuka)</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
          <input
            name="topik"
            defaultValue={kelas.topik}
            placeholder="Topik/Penerangan"
            required
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />
          <input
            name="lokasi"
            defaultValue={kelas.lokasi}
            placeholder="Lokasi (cth: Dewan PLT, Kuala Lumpur)"
            required
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="jadual"
            defaultValue={kelas.jadual ?? ""}
            placeholder="Jadual (cth: Setiap Isnin & Khamis, 8-9pm)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="maxPeserta"
            type="number"
            defaultValue={kelas.maxPeserta ?? ""}
            placeholder="Had Bilangan Peserta (kosongkan jika tiada had)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="yuranRM"
            type="number"
            step="0.01"
            defaultValue={yuranRM}
            placeholder="Yuran (RM) - 0 jika percuma"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="picName"
            defaultValue={kelas.picName ?? ""}
            placeholder="Nama Person In Charge (PIC)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="picContact"
            defaultValue={kelas.picContact ?? ""}
            placeholder="Contact PIC (telefon/emel)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <select name="status" defaultValue={kelas.status} className="border border-brand-dark/20 rounded-sm p-3">
            <option value="TERBUKA">Terbuka</option>
            <option value="PENUH">Penuh</option>
            <option value="TAMAT">Tamat</option>
          </select>
          <div className="sm:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="flex-1 bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3">
              SIMPAN PERUBAHAN
            </button>
            <Link
              href="/admin/classes"
              className="flex-1 text-center border border-brand-dark/20 text-brand-dark font-semibold rounded-sm px-4 py-3"
            >
              BATAL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
