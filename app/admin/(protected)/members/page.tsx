export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CsvImportForm from "@/components/CsvImportForm";

export default async function AdminMembersPage() {
  requireAdminOnly();
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Senarai Ahli</h1>

      <CsvImportForm />

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Ahli Sedia Ada (Import Manual)</h2>
        <form action="/api/admin/members/import" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input name="memberNo" placeholder="No Ahli (cth: PLT-050)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="fullName" placeholder="Nama Penuh" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="icNumber" placeholder="No KP (12 digit)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="phone" placeholder="No Telefon" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="email" type="email" placeholder="E-mel" required className="border border-brand-dark/20 rounded-sm p-3" />
          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH AHLI
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">No Ahli</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Telefon</th>
              <th className="p-4">E-mel</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tarikh Sertai</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-brand-cream">
                <td className="p-4 font-medium">{m.memberNo}</td>
                <td className="p-4">{m.fullName}</td>
                <td className="p-4">{m.phone}</td>
                <td className="p-4">{m.email}</td>
                <td className="p-4">{m.status}</td>
                <td className="p-4">{m.joinedAt.toLocaleDateString("ms-MY")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
