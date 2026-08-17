import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image src="/logo.png" alt="Pertubuhan Literasi Tanah" width={40} height={40} className="rounded-lg" />
            <p className="font-display text-lg font-bold">PERTUBUHAN LITERASI TANAH</p>
          </div>
          <p className="text-sm text-white/70">
            Mencelikkan masyarakat tentang ilmu tanah, undang-undang, hak pemilikan &
            pengurusan harta dengan berilmu.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">PETA LAMAN</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/">Utama</Link></li>
            <li><Link href="/tentang-kami">Tentang Kami</Link></li>
            <li><Link href="/keahlian">Keahlian</Link></li>
            <li><Link href="/kelas-tanah">Kelas Tanah</Link></li>
            <li><Link href="/merchandise">Merchandise</Link></li>
            <li><Link href="/aktiviti">Aktiviti</Link></li>
            <li><Link href="/hubungi-kami">Hubungi Kami</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">HUBUNGI KAMI</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li>Pertubuhan Literasi Tanah</li>
            <li>info@tanahmalaya.org</li>
            <li>tanahmalaya.org</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">IKUTI KAMI</p>
          <p className="text-sm text-white/80">Facebook &middot; Instagram &middot; TikTok &middot; YouTube</p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} Pertubuhan Literasi Tanah. Hak Cipta Terpelihara. No. Pendaftaran: PPM-001-10-17042026
      </div>
    </footer>
  );
}
