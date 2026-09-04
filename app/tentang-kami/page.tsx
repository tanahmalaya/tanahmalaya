import Link from "next/link";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import OrgInfoCard from "@/components/keahlian/OrgInfoCard";

export const metadata = {
  title: "Tentang Kami",
  description:
    "Kenali Pertubuhan Literasi Tanah (PPM-001-10-17042026) — misi kami mendidik masyarakat Malaysia tentang hak milik, undang-undang tanah, pusaka, hibah dan pecah sempadan.",
  alternates: { canonical: "/tentang-kami" },
};

function IconGraduationCap() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 8v6" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </svg>
  );
}

const AKTIVITI = [
  {
    title: "Kelas & Program",
    desc: "Kelas praktikal tentang geran hakmilik, pusaka, hibah dan pecah sempadan tanah.",
    Icon: IconGraduationCap,
  },
  {
    title: "Seminar",
    desc: "Seminar bersama penceramah berpengalaman dalam undang-undang dan pengurusan tanah.",
    Icon: IconMic,
  },
  {
    title: "Kembara Ilmu",
    desc: "Lawatan dan kembara ilmu ke lokasi sebenar untuk pembelajaran secara praktikal.",
    Icon: IconCompass,
  },
];

export default function TentangKamiPage() {
  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-dark text-white border-b border-brand-gold/30">
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,138,46,0.18) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="max-w-4xl mx-auto px-6 py-10 relative">
          <BackButton href="/" label="Kembali" variant="dark" className="mb-6" />
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-brand-gold/40">
              <Image src="/logo.png" width={64} height={64} alt="Pertubuhan Literasi Tanah" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide">TENTANG KAMI</h1>
              <p className="text-white/60 text-sm mt-1 max-w-lg">
                Mendidik masyarakat Malaysia tentang hak milik, undang-undang tanah dan
                pengurusan harta secara sah dan berilmu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Misi */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-brand-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">Misi Kami</p>
        <p className="text-brand-dark/80 leading-relaxed mb-4 text-lg">
          Pertubuhan Literasi Tanah (PLT) — No. Pendaftaran PPM-001-10-17042026 —
          komited untuk mendidik masyarakat Malaysia tentang hak milik, undang-undang
          tanah dan pengurusan harta secara sah dan berilmu.
        </p>
        <p className="text-brand-dark/70 leading-relaxed">
          Melalui kelas, seminar, dan program kembara ilmu, kami membantu ahli
          masyarakat memahami geran hakmilik, pusaka, hibah, dan proses pecah sempadan
          tanah supaya hak mereka terpelihara untuk generasi akan datang.
        </p>
      </section>

      {/* Apa yang kami buat */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <p className="text-center text-brand-gold text-xs font-semibold tracking-[0.2em] uppercase mb-8">
          Apa Yang Kami Buat
        </p>
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
          {AKTIVITI.map(({ title, desc, Icon }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-4">
                <Icon />
              </div>
              <p className="font-semibold mb-1.5">{title}</p>
              <p className="text-sm text-brand-dark/60 max-w-[220px] mx-auto">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/aktiviti" className="text-brand-gold text-sm font-semibold hover:underline">
            Lihat aktiviti kami &rarr;
          </Link>
        </div>
      </section>

      {/* Maklumat pertubuhan */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-brand-dark rounded-md p-6">
          <OrgInfoCard />
        </div>
      </section>
    </>
  );
}
