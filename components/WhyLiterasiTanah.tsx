function IconBook() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5c-1.5-1-4-1.5-6-1v13c2 0 4.5.5 6 1.5 1.5-1 4-1.5 6-1.5V5.5c-2-.5-4.5 0-6 1z" />
      <path d="M12 6.5V19" />
    </svg>
  );
}

function IconScale() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M5 7 2 13a3 3 0 0 0 6 0L5 7z" />
      <path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6z" />
      <path d="M8 21h8" />
    </svg>
  );
}

function IconShieldHome() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3.5v5.2c0 5-3.4 8.3-8 9.3-4.6-1-8-4.3-8-9.3V6.5L12 3z" />
      <path d="M9.5 12.5 12 10.5l2.5 2v3.5h-5v-3.5z" />
    </svg>
  );
}

const items = [
  {
    title: "Fahami Hak Anda",
    desc: "Ilmu asas mengenai hak milik & undang-undang tanah.",
    Icon: IconBook,
  },
  {
    title: "Kenali Undang-Undang",
    desc: "Memahami perkara penting berkaitan undang-undang tanah.",
    Icon: IconScale,
  },
  {
    title: "Lindungi Harta",
    desc: "Buat keputusan pemilikan berdasarkan ilmu yang betul.",
    Icon: IconShieldHome,
  },
];

export default function WhyLiterasiTanah() {
  return (
    <section className="max-w-7xl mx-auto px-6">
      <p className="text-center text-brand-gold text-xs font-semibold tracking-[0.2em] uppercase mb-8">
        Kenapa Literasi Tanah?
      </p>
      <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
        {items.map(({ title, desc, Icon }) => (
          <div key={title} className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-4">
              <Icon />
            </div>
            <p className="font-semibold mb-1.5">{title}</p>
            <p className="text-sm text-brand-dark/60 max-w-[220px] mx-auto">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
