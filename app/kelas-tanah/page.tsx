export const dynamic = "force-dynamic";

import ClassTable from "@/components/ClassTable";
import BackButton from "@/components/BackButton";

export default function KelasTanahPage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
        <h1 className="font-display text-3xl font-bold">Program &amp; Kelas</h1>
        <p className="text-brand-dark/70 mt-2">Senarai penuh program dan kelas yang akan datang.</p>
      </div>
      <ClassTable />
    </section>
  );
}
