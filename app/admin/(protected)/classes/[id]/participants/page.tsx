export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ClassParticipantsPage({ params }: { params: { id: string } }) {
  requireAdminOnly();

  const kelas = await prisma.landClass.findUnique({
    where: { id: params.id },
    include: { registrations: { orderBy: { createdAt: "desc" } } },
  });
  if (!kelas) return notFound();

  return (
    <div>
      <Link href="/admin/classes" className="text-sm text-brand-gold mb-4 inline-block">
        &larr; Kembali ke Senarai Program &amp; Kelas
      </Link>
      <h1 className="font-display text-2xl font-bold mb-1">{kelas.namaKelas}</h1>
      <p className="text-brand-dark/60 mb-6 text-sm">
        {kelas.registrations.filter((r) => r.status === "BERJAYA").length} peserta berjaya daftar
        {kelas.maxPeserta ? ` (had ${kelas.maxPeserta})` : ""}
      </p>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Telefon</th>
              <th className="p-4">E-mel</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tarikh Daftar</th>
            </tr>
          </thead>
          <tbody>
            {kelas.registrations.map((r) => (
              <tr key={r.id} className="border-t border-brand-cream">
                <td className="p-4">{r.namaPeserta}</td>
                <td className="p-4">{r.telefon}</td>
                <td className="p-4">{r.emel}</td>
                <td className="p-4">
                  <span
                    className={
                      r.status === "BERJAYA"
                        ? "text-green-600 font-semibold"
                        : r.status === "GAGAL"
                        ? "text-red-500"
                        : "text-orange-500"
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-4">{r.createdAt.toLocaleDateString("ms-MY")}</td>
              </tr>
            ))}
            {kelas.registrations.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-brand-dark/50">
                  Belum ada pendaftaran lagi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
