import BackButton from "@/components/BackButton";
import AduanTanahForm from "@/components/aduan/AduanTanahForm";

export const metadata = {
  title: "Hubungi Kami",
  description:
    "Hubungi Pertubuhan Literasi Tanah melalui e-mel info@tanahmalaya.org, atau isi Borang Aduan Pencerobohan Tanah untuk melaporkan isu pencerobohan/penyalahgunaan tanah.",
  alternates: { canonical: "/hubungi-kami" },
};

export default function HubungiKamiPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-3xl font-bold mb-2">Hubungi Kami</h1>
      <p className="text-sm text-brand-dark/60 mb-10">
        Ada pertanyaan am? E-mel kami di{" "}
        <a href="mailto:info@tanahmalaya.org" className="text-brand-gold underline">
          info@tanahmalaya.org
        </a>
        . Untuk laporkan isu pencerobohan atau penyalahgunaan tanah, isi borang di bawah.
      </p>

      <div>
        <h2 className="font-display text-2xl font-bold mb-2">Borang Aduan &amp; Maklumat Pencerobohan Tanah</h2>
        <p className="text-brand-dark/70 mb-6">
          Borang ini bertujuan untuk mengumpul maklumat dan bukti berhubung isu pencerobohan atau
          penyalahgunaan tanah. Maklumat yang dikemukakan akan digunakan untuk pemantauan, analisis
          literasi undang-undang tanah, serta rujukan tindakan susulan. Tandakan lokasi pencerobohan
          terus pada peta di tab &ldquo;2. Lokasi Tanah&rdquo; di bawah.
        </p>
        <AduanTanahForm />
      </div>
    </section>
  );
}
