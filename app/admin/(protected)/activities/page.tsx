export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteEntityButton from "@/components/DeleteEntityButton";

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  requireAdminOnly();
  const activities = await prisma.activity.findMany({ orderBy: { tarikh: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Urus Aktiviti</h1>

      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-4 mb-6">
          {searchParams.error}
        </div>
      )}

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Aktiviti</h2>
        <form action="/api/activities" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input type="date" name="tarikh" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="tajuk" placeholder="Tajuk" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Gambar (sehingga 4 keping, semua pilihan)</p>
          </div>
          <input name="gambar1" placeholder="URL Gambar 1" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar2" placeholder="URL Gambar 2" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar3" placeholder="URL Gambar 3" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambar4" placeholder="URL Gambar 4" className="border border-brand-dark/20 rounded-sm p-3" />
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH AKTIVITI
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">Tarikh</th>
              <th className="p-4">Tajuk</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-t border-brand-cream">
                <td className="p-4 whitespace-nowrap">{a.tarikh.toLocaleDateString("ms-MY")}</td>
                <td className="p-4">{a.tajuk}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/activities/${a.id}/edit`} className="text-brand-gold text-xs font-bold">
                      EDIT
                    </Link>
                    <DeleteEntityButton
                      action={`/api/activities/${a.id}/delete`}
                      confirmText={`Padam aktiviti "${a.tajuk}"? Tindakan ini tidak boleh dibatalkan.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-brand-dark/50">
                  Tiada aktiviti lagi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
