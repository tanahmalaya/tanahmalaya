import Link from "next/link";
import GeranLogo from "@/components/geran/GeranLogo";

// Footer tersendiri untuk /geran - sengaja tak guna Footer.tsx utama supaya
// bahagian ni rasa seperti produk berasingan. Kekal satu baris kecil pautan
// balik ke tanahmalaya.org untuk ketelusan (Hubungi PLT, semakan, dsb semua
// masih dikendalikan PLT), tanpa menjadikan reka bentuk keseluruhan nampak
// macam laman utama.
export default function GeranFooter() {
  return (
    <footer className="bg-[#0E3B2E] text-white/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2.5">
          <GeranLogo size={28} />
          <span className="font-display font-bold text-white tracking-tight">GERAN</span>
        </div>
        <p className="text-xs max-w-sm leading-relaxed">
          Diuruskan oleh{" "}
          <Link href="https://tanahmalaya.org" className="underline hover:text-white">
            Pertubuhan Literasi Tanah
          </Link>
          . Setiap penyenaraian disemak &amp; disahkan sebelum diterbitkan.
        </p>
        <p className="text-[11px] text-white/40">© {new Date().getFullYear()} GERAN</p>
      </div>
    </footer>
  );
}
