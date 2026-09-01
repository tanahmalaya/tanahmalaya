import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Hubungi Kami",
  description:
    "Hubungi Pertubuhan Literasi Tanah melalui e-mel info@tanahmalaya.org untuk sebarang pertanyaan mengenai keahlian, kelas atau aktiviti kami.",
  alternates: { canonical: "/hubungi-kami" },
};

export default function HubungiKamiPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-3xl font-bold mb-6">Hubungi Kami</h1>
      <div className="bg-white rounded-md shadow-sm p-8 space-y-3">
        <p><strong>Pertubuhan Literasi Tanah</strong></p>
        <p>E-mel: info@tanahmalaya.org</p>
        <p>Laman web: tanahmalaya.org</p>
        <p>No. Pendaftaran: PPM-001-10-17042026</p>
      </div>
    </section>
  );
}
