export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  requireAdminOnly();
  const [members, classes, activities, products] = await Promise.all([
    prisma.member.count(),
    prisma.landClass.count(),
    prisma.activity.count(),
    prisma.product.count(),
  ]);

  const stats = [
    { label: "Jumlah Ahli", value: members },
    { label: "Kelas Tanah", value: classes },
    { label: "Aktiviti", value: activities },
    { label: "Produk Merchandise", value: products },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Ringkasan Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-md shadow-sm p-6">
            <p className="text-sm text-brand-dark/60">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
