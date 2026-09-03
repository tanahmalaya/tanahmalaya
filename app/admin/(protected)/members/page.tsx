export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CsvImportForm from "@/components/CsvImportForm";

const TYPE_LABEL: Record<string, string> = {
  PLT: "Ahli PLT",
  BERSEKUTU: "Ahli Bersekutu",
};

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  MENUNGGU_BAYARAN: "Menunggu Bayaran",
  MENUNGGU_SEMAKAN: "Menunggu Semakan (Selangor)",
};

export default async function AdminMembersPage() {
  requireAdminOnly();
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });
  const pendingSemakan = members.filter((m) => m.status === "MENUNGGU_SEMAKAN");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Senarai Ahli</h1>

      {pendingSemakan.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-6 mb-8">
          <h2 className="font-semibold mb-1 text-amber-900">
            {pendingSemakan.length} Ahli PLT Menunggu Semakan Selangor
          </h2>
          <p className="text-xs text-amber-800/80 mb-4">
            Ahli ni dah bayar yuran tapi kena disahkan dulu (bermastautin/berdaftar mengundi
            Selangor) - sila semak manual di portal SPR guna nama &amp; No KP di bawah sebelum sahkan.
          </p>
          <div className="space-y-2">
            {pendingSemakan.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-sm p-3 text-sm">
                <div>
                  <span className="font-medium">{m.fullName}</span>{" "}
                  <span className="text-brand-dark/50">({m.icNumber})</span>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/admin/members/${m.id}/verify`} method="POST">
                    <button type="submit" className="bg-green-600 text-white text-xs font-semibold rounded-sm px-3 py-2">
                      SAHKAN (AKTIFKAN)
                    </button>
                  </form>
                  <form action={`/api/admin/members/${m.id}/reject`} method="POST">
                    <button type="submit" className="bg-red-600 text-white text-xs font-semibold rounded-sm px-3 py-2">
                      TOLAK
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CsvImportForm />

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Ahli Sedia Ada (Import Manual)</h2>
        <form action="/api/admin/members/import" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input name="memberNo" placeholder="No Ahli (cth: TM-050 / PLT-050)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <select name="memberType" required defaultValue="PLT" className="border border-brand-dark/20 rounded-sm p-3">
            <option value="PLT">Ahli PLT (siri TM-)</option>
            <option value="BERSEKUTU">Ahli Bersekutu (siri PLT-)</option>
          </select>
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
              <th className="p-4">Jenis</th>
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
                <td className="p-4 font-medium">
                  {m.memberNo}
                  {m.noAhliLama && (
                    <span className="block text-xs font-normal text-brand-dark/50">
                      (dahulu {m.noAhliLama})
                    </span>
                  )}
                </td>
                <td className="p-4">{TYPE_LABEL[m.type] || m.type}</td>
                <td className="p-4">{m.fullName}</td>
                <td className="p-4">{m.phone}</td>
                <td className="p-4">{m.email}</td>
                <td className="p-4">{STATUS_LABEL[m.status] || m.status}</td>
                <td className="p-4">{m.joinedAt.toLocaleDateString("ms-MY")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
