export const dynamic = "force-dynamic";

import ClassTable from "@/components/ClassTable";

export default function KelasTanahPage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="font-display text-3xl font-bold">Kelas Tanah</h1>
        <p className="text-brand-dark/70 mt-2">Jadual penuh kelas yang akan datang.</p>
      </div>
      <ClassTable />
    </section>
  );
}
