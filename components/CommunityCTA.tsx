import Link from "next/link";

function IconPeople() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M15.5 14.7c2.5.3 4.5 2.3 4.5 5.3" />
    </svg>
  );
}

export default function CommunityCTA() {
  return (
    <section className="max-w-7xl mx-auto px-6">
      <div className="bg-brand-dark text-white rounded-md p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
            <IconPeople />
          </div>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-1.5">
              SERTAI KOMUNITI LITERASI TANAH
            </h2>
            <p className="text-white/60 text-sm max-w-md">
              Bersama kita melindungi hak, memahami undang-undang dan mewarisi tanah negara.
            </p>
          </div>
        </div>
        <Link
          href="/keahlian"
          className="bg-brand-gold text-brand-dark px-6 py-3 rounded-sm font-semibold shrink-0 hover:opacity-90 transition-opacity"
        >
          DAFTAR SEKARANG
        </Link>
      </div>
    </section>
  );
}
