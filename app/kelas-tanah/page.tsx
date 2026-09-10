export const dynamic = "force-dynamic";

import ClassTable from "@/components/ClassTable";
import BackButton from "@/components/BackButton";
import { requirePltMember } from "@/lib/memberAuth";

export const metadata = {
  title: "Program & Kelas",
  description:
    "Senarai penuh program dan kelas tanah akan datang anjuran Pertubuhan Literasi Tanah — belajar tentang geran hakmilik, pusaka, hibah dan pecah sempadan.",
  alternates: { canonical: "/kelas-tanah" },
};

// Kawasan Ahli PLT sahaja - lihat lib/memberAuth.ts.
export default async function KelasTanahPage() {
  await requirePltMember("/kelas-tanah");

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
