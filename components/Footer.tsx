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
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center text-center">
          <p className="font-semibold mb-4 text-brand-gold tracking-wide">
            AKAUN BANK PERTUBUHAN
          </p>
          <div className="bg-white/5 border border-white/10 rounded-md p-6 w-full max-w-md flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[#FFC72C] shrink-0">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2A1D14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5 12 4l9 6.5" />
                  <path d="M5 10.5V19h14v-8.5" />
                  <path d="M9 19v-5h6v5" />
                </svg>
              </span>
              <p className="text-lg font-bold">Maybank</p>
            </div>

            <div className="w-full border-t border-white/10" />

            <div className="grid grid-cols-2 gap-4 w-full text-sm">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Nama Akaun</p>
                <p className="font-semibold">Pertubuhan Literasi Tanah</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">No. Akaun</p>
                <p className="font-semibold tracking-wide">562647362534</p>
              </div>
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
