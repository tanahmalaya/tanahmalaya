import Link from "next/link";
import Image from "next/image";

export default function SertaiKami() {
  return (
    <section className="relative bg-brand-dark overflow-hidden">
      {/* Background banner image */}
      <div className="absolute inset-0">
        <Image
          src="/banner-sertai-kami.jpg"
          alt="Sertai Pertubuhan Literasi Tanah"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="max-w-xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4">
            Sertai Pertubuhan Literasi Tanah
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Ilmu tanah bukan untuk mereka yang bekerja dengan tanah sahaja. Ia
            untuk setiap orang yang memiliki, mewarisi atau bercadang
            memiliki tanah.
          </p>
        </div>

        <Link
          href="/Membership"
          className="shrink-0 inline-flex items-center gap-2 bg-brand-gold text-brand-dark font-semibold text-sm md:text-base px-8 py-4 rounded-lg hover:bg-brand-gold/90 transition-colors"
        >
          DAFTAR Membership SEKARANG <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
