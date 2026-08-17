import { prisma } from "@/lib/prisma";

const statusColor: Record<string, string> = {
  TERBUKA: "text-green-600",
  PENUH: "text-orange-500",
  TAMAT: "text-red-500",
};

export default async function ClassTable() {
  const classes = await prisma.landClass.findMany({
    orderBy: { tarikh: "asc" },
    take: 4,
  });

  return (
    <section>
      <h2 className="font-display text-2xl font-bold mb-6">JADUAL KELAS TANAH</h2>
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr>
              <th className="p-4">Tarikh</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Topik</th>
              <th className="p-4">Lokasi</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((k) => (
              <tr key={k.id} className="border-t border-brand-cream">
                <td className="p-4">{k.tarikh.toLocaleDateString("ms-MY")}</td>
                <td className="p-4">{k.namaKelas}</td>
                <td className="p-4">{k.topik}</td>
                <td className="p-4">{k.lokasi}</td>
                <td className={`p-4 font-semibold ${statusColor[k.status]}`}>
                  {k.status === "TERBUKA" ? "Terbuka" : k.status === "PENUH" ? "Penuh" : "Tamat"}
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-brand-dark/50">
                  Belum ada kelas dijadualkan. Tambah dari dashboard admin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
