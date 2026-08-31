export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditActivityPage({ params }: { params: { id: string } }) {
  requireAdminOnly();

  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!activity) return notFound();

  const tarikhValue = activity.tarikh.toISOString().slice(0, 10);

  return (
    <div>
      <Link href="/admin/activities" className="text-sm text-brand-gold mb-4 inline-block">
        &larr; Kembali ke Senarai Aktiviti
      </Link>
      <h1 className="font-display text-2xl font-bold mb-6">Edit Aktiviti</h1>

      <div className="bg-white rounded-md shadow-sm p-6">
        <form action={`/api/activities/${activity.id}/update`} method="POST" className="grid sm:grid-cols-2 gap-4">
          <input type="date" name="tarikh" defaultValue={tarikhValue} required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="tajuk" defaultValue={activity.tajuk} placeholder="Tajuk" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Gambar (sehingga 4 keping, semua pilihan)</p>
          </div>
          <input name="gambar1" defaultValue={activity.gambar1 ?? ""} placeholder="URL Gambar 1" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar2" defaultValue={activity.gambar2 ?? ""} placeholder="URL Gambar 2" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar3" defaultValue={activity.gambar3 ?? ""} placeholder="URL Gambar 3" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar4" defaultValue={activity.gambar4 ?? ""} placeholder="URL Gambar 4" className="border border-brand-dark/20 rounded-sm p-3" />
          <div className="sm:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="flex-1 bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3">
              SIMPAN PERUBAHAN
            </button>
            <Link
              href="/admin/activities"
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
