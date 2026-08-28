import Link from "next/link";

const cards = [
  { title: "Borang Membership", desc: "Sertai kami sebagai ahli berdaftar dan nikmati pelbagai manfaat.", cta: "DAFTAR SEKARANG", href: "/Membership" },
  { title: "Program & Kelas", desc: "Sertai pelbagai program dan kelas anjuran PLT - tanah, kemahiran, dan banyak lagi.", cta: "LIHAT JADUAL", href: "/kelas-tanah" },
  { title: "Merchandise", desc: "Dapatkan Merchandise eksklusif untuk ahli & penyokong PLT.", cta: "KUNJUNGI KEDAI", href: "/Merchandise" },
  { title: "Aktiviti", desc: "Sertai program, seminar, kembara ilmu dan Aktiviti komuniti kami.", cta: "LIHAT Aktiviti", href: "/Aktiviti" },
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
