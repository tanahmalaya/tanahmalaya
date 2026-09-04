import Link from "next/link";
import Image from "next/image";
import MemberCount from "@/components/MemberCount";

export default function Hero() {
  return (
    <section className="relative bg-brand-dark text-white overflow-hidden">
      <div
        className="absolute -right-32 -top-32 w-[36rem] h-[36rem] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(198,138,46,0.18) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6 py-20 md:py-28 relative">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-5">
            MEMELIHARA<br />TANAH NEGARA
          </h1>
          <p className="text-white/70 mb-8 max-w-md leading-relaxed">
            Ilmu tentang tanah.<br />
            Hak untuk memiliki.<br />
            Tanggungjawab untuk mewarisi.
          </p>
          <div className="flex items-center gap-6 mb-10">
            <Link
              href="/keahlian"
              className="bg-brand-gold text-brand-dark px-6 py-3 rounded-sm font-semibold hover:opacity-90 transition-opacity"
            >
              SERTAI PLT
            </Link>
            <Link href="/kelas-tanah" className="font-semibold text-sm hover:text-brand-gold transition-colors">
              Lihat Program &rarr;
            </Link>
          </div>

          <MemberCount />
        </div>

        <div className="relative h-72 md:h-96">
          <div className="absolute inset-0 md:rotate-2 rounded-lg overflow-hidden shadow-2xl border border-white/10">
            <Image
              src="/hero-geran.jpg"
              alt="Geran Hakmilik"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
