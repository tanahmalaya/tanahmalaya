import Image from "next/image";
import BulanBintang from "@/components/BulanBintang";

export default function MerdekaBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6">
      <div className="relative overflow-hidden rounded-md shadow-sm bg-[#010066] text-white">
        {/* motif bulan & bintang jalur 14 sebagai hiasan latar */}
        <BulanBintang className="absolute -top-6 -right-10 w-56 h-28 opacity-20" />
        <BulanBintang className="absolute -bottom-8 -left-10 w-40 h-20 opacity-15 hidden sm:block" />

        <div className="relative px-6 py-10 md:px-12 md:py-14 text-center">
          <div className="relative w-40 md:w-52 h-24 md:h-32 mx-auto mb-5 drop-shadow-lg">
            <Image
              src="/bendera-malaysia.png"
              alt="Bendera Malaysia"
              fill
              sizes="(min-width: 768px) 208px, 160px"
              className="object-contain"
              priority
            />
          </div>

          <p className="uppercase tracking-[0.3em] text-xs md:text-sm text-[#FFCC00] font-semibold mb-3">
            31 Ogos 2026 &middot; Sambutan Hari Kebangsaan Ke-69
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
            SELAMAT HARI MERDEKA
          </h2>
          <p className="text-white/85 max-w-2xl mx-auto text-sm md:text-base">
            Tanah yang subur adalah lambang kedaulatan negara. Sempena Hari Kebangsaan, PLT
            menyeru masyarakat terus berilmu dalam memelihara hak milik dan warisan tanah
            demi generasi akan datang.
          </p>
        </div>
      </div>
    </section>
  );
}
