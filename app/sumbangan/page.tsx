import BackButton from "@/components/BackButton";
import SumbanganCard from "@/components/SumbanganCard";

export const metadata = {
  title: "Sumbangan Ikhlas",
  description:
    "Sumbang kepada Pertubuhan Literasi Tanah untuk menyokong program pendidikan dan advokasi literasi tanah di Malaysia.",
  alternates: { canonical: "/sumbangan" },
};

export default function SumbanganPage() {
  return (
    <section className="max-w-lg mx-auto px-6 py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-3xl font-bold mb-2">Sumbangan Ikhlas</h1>
      <p className="text-brand-dark/70 mb-8">
        Setiap sumbangan membantu Pertubuhan Literasi Tanah meneruskan kelas, seminar dan advokasi
        literasi tanah untuk masyarakat Malaysia.
      </p>
      <SumbanganCard />
    </section>
  );
}
