import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "UTAMA" },
  { href: "/tentang-kami", label: "TENTANG KAMI" },
  { href: "/keahlian", label: "KEAHLIAN" },
  { href: "/kelas-tanah", label: "KELAS TANAH" },
  { href: "/merchandise", label: "MERCHANDISE" },
  { href: "/aktiviti", label: "AKTIVITI" },
  { href: "/hubungi-kami", label: "HUBUNGI KAMI" },
];

export default function Header() {
  return (
    <header className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Pertubuhan Literasi Tanah"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <span className="font-display leading-tight">
            <span className="block text-xs tracking-widest text-brand-gold">PERTUBUHAN</span>
            <span className="block text-lg font-bold">LITERASI TANAH</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium tracking-wide">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-gold transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/keahlian"
          className="bg-brand-gold text-brand-dark px-5 py-2 rounded-sm text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          DAFTAR SEKARANG
        </Link>
      </div>
    </header>
  );
}
