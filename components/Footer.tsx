import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="bg-white rounded-md p-2 w-fit mb-3">
            <Image src="/logo-footer.png" alt="Pertubuhan Literasi Tanah" width={120} height={120} />
          </div>
          <p className="text-sm text-white/70">
            Mendidik masyarakat tentang ilmu tanah, undang-undang, hak pemilikan &
            pengurusan harta dengan berilmu.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">PETA LAMAN</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/">Utama</Link></li>
            <li><Link href="/tentang-kami">Tentang Kami</Link></li>
            <li><Link href="/keahlian">Keahlian</Link></li>
            <li><Link href="/kelas-tanah">Program &amp; Kelas</Link></li>
            <li><Link href="/merchandise">Merchandise</Link></li>
            <li><Link href="/aktiviti">Aktiviti</Link></li>
            <li><Link href="/hubungi-kami">Hubungi Kami</Link></li>
            <li><Link href="/terma-perkhidmatan">Terma Perkhidmatan</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">Hubungi Kami</p>
          <a href="mailto:info@tanahmalaya.org" className="text-sm text-white/80 hover:text-brand-gold">
            info@tanahmalaya.org
          </a>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">IKUTI KAMI</p>
          <a
            href="https://web.facebook.com/profile.php?id=61592322463148"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/80 hover:text-brand-gold"
          >
            Facebook
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="font-semibold mb-3 text-brand-gold text-center md:text-left">
            AKAUN BANK PERTUBUHAN
          </p>
          <div className="bg-white/5 border border-white/10 rounded-md p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 text-sm">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Bank</p>
              <p className="font-semibold">Maybank</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Nama Akaun</p>
              <p className="font-semibold">Literasi Tanah</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">No. Akaun</p>
              <p className="font-semibold tracking-wide">562647362534</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} Pertubuhan Literasi Tanah. Hak Cipta Terpelihara. No. Pendaftaran: PPM-001-10-17042026
      </div>
    </footer>
  );
}
