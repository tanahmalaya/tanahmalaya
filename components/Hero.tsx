import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative bg-brand-dark text-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center px-6 py-20">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            CELIK TANAH<br />BANGKIT HAK ANDA
          </h1>
          <p className="text-white/80 mb-8 max-w-md">
            Pertubuhan Literasi Tanah komited untuk mencelikkan masyarakat tentang hak milik,
            undang-undang tanah dan pemilikan harta secara sah dan berilmu.
          </p>
          <div className="flex gap-4">
            <Link href="/keahlian" className="bg-brand-gold text-brand-dark px-6 py-3 rounded-sm font-semibold">
              SERTAI KAMI
            </Link>
            <Link href="/kelas-tanah" className="border border-white px-6 py-3 rounded-sm font-semibold">
              KELAS SETERUSNYA
            </Link>
          </div>
        </div>

        <div className="relative h-72 md:h-96 rounded-lg overflow-hidden">
          {/* Gantikan src di bawah dengan gambar geran hakmilik sebenar */}
          <Image
            src="/hero-geran.jpg"
            alt="Geran Hakmilik"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
