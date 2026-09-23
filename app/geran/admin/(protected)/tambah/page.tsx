export const dynamic = "force-dynamic";

import GeranAdminCreateForm from "@/components/geran/GeranAdminCreateForm";

export default function GeranAdminTambahPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Tambah Tanah (GT / KJ Land)</h1>
      <GeranAdminCreateForm />
    </div>
  );
}
