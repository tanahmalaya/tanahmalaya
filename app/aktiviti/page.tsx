export const dynamic = "force-dynamic";

import ActivityGrid from "@/components/ActivityGrid";
import BackButton from "@/components/BackButton";

export default function AktivitiPage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
        <h1 className="font-display text-3xl font-bold">Aktiviti</h1>
        <p className="text-brand-dark/70 mt-2">Program, seminar dan kembara ilmu terkini.</p>
      </div>
      <ActivityGrid />
    </section>
  );
}
