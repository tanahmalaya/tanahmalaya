import Link from "next/link";

const cards = [
  { title: "BORANG KEAHLIAN", desc: "Sertai kami sebagai ahli berdaftar dan nikmati pelbagai manfaat.", cta: "DAFTAR SEKARANG", href: "/keahlian" },
  { title: "KELAS TANAH", desc: "Jadual kelas terkini tentang undang-undang tanah, pusaka, geran & banyak lagi.", cta: "LIHAT JADUAL", href: "/kelas-tanah" },
  { title: "MERCHANDISE", desc: "Dapatkan merchandise eksklusif untuk ahli & penyokong PLIIT.", cta: "KUNJUNGI KEDAI", href: "/merchandise" },
  { title: "AKTIVITI", desc: "Sertai program, seminar, kembara ilmu dan aktiviti komuniti kami.", cta: "LIHAT AKTIVITI", href: "/aktiviti" },
];

export default function FeatureCards() {
  return (
    <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.title} className="bg-white rounded-md shadow-sm p-6">
          <h3 className="font-bold mb-2">{c.title}</h3>
          <p className="text-sm text-brand-dark/70 mb-4">{c.desc}</p>
          <Link href={c.href} className="text-brand-gold text-sm font-semibold">
            {c.cta} &rarr;
          </Link>
        </div>
      ))}
    </section>
  );
}
