import Link from "next/link";
import Image from "next/image";

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 6.5L20.5 6" />
    </svg>
  );
}

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
          <a
            href="mailto:info@tanahmalaya.org"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-brand-gold"
          >
            <IconMail />
            info@tanahmalaya.org
          </a>
        </div>

        <div>
          <p className="font-semibold mb-3 text-brand-gold">IKUTI KAMI</p>
          <a
            href="https://web.facebook.com/profile.php?id=61592322463148"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-brand-gold"
          >
            <IconFacebook />
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
