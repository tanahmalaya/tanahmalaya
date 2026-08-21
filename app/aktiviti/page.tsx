export const revalidate = 60;

import ActivityGrid from "@/components/ActivityGrid";

export default function AktivitiPage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="font-display text-3xl font-bold">Aktiviti</h1>
        <p className="text-brand-dark/70 mt-2">Program, seminar dan kembara ilmu terkini.</p>
      </div>
      <ActivityGrid />
    </section>
  );
}
