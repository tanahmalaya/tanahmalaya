import Link from "next/link";

// Penerangan ringkas tentang GERAN untuk pelawat kali pertama - sebelum ni
// halaman /geran terus masuk ke direktori tanpa beritahu laman ni apa.
// Diletak di bawah senarai supaya pembeli yang datang untuk cari tanah tak
// kena skrol lalu dulu, tapi masih dibaca enjin carian.
const LANGKAH_PEMBELI = [
  {
    tajuk: "Search the directory",
    teks: "Filter by state, district, land type, title type and price. Every listing shows the lot details up front.",
  },
  {
    tajuk: "Save what interests you",
    teks: "Create a free account to keep listings in your favorites and come back to them later.",
  },
  {
    tajuk: "Contact PLT",
    teks: "Reach out through PLT and we will help you follow up with the seller on the land you are interested in.",
  },
];

const LANGKAH_PENJUAL = [
  {
    tajuk: "Sign up free",
    teks: "An account takes a minute — your name, phone number and email, verified by a code sent to your inbox.",
  },
  {
    tajuk: "Submit your land",
    teks: "Fill in the lot details and attach the full title copy so PLT can check the caveats, charges and restrictions.",
  },
  {
    tajuk: "PLT reviews it",
    teks: "Once verified, your land appears in the public directory in front of buyers looking for exactly that.",
  },
];

function Langkah({ items }: { items: { tajuk: string; teks: string }[] }) {
  return (
    <ol className="grid sm:grid-cols-3 gap-4 mt-4">
      {items.map((s, i) => (
        <li key={s.tajuk} className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0E3B2E] text-white text-xs font-bold mb-3">
            {i + 1}
          </span>
          <p className="font-bold text-[#0E3B2E] text-[15px] mb-1">{s.tajuk}</p>
          <p className="text-[13px] text-[#0E3B2E]/55 leading-relaxed">{s.teks}</p>
        </li>
      ))}
    </ol>
  );
}

export default function GeranAbout({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="mt-14 border-t border-black/[0.07] pt-10">
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E]">
        About GERAN
      </h2>
      <p className="text-[#0E3B2E]/60 text-[15px] leading-relaxed mt-3 max-w-3xl">
        GERAN is a marketplace for buying and selling titled land in Malaysia. Every lot listed here
        holds a proper title with clear ownership — no unregistered plots and no ambiguous claims. It is
        run by{" "}
        <Link href="https://tanahmalaya.org" className="underline hover:text-[#0E3B2E]">
          Pertubuhan Literasi Tanah (PLT)
        </Link>
        , a land literacy organisation, which is why every listing goes through a review before it is
        published.
      </p>
      <p className="text-[#0E3B2E]/60 text-[15px] leading-relaxed mt-3 max-w-3xl">
        Owners submit a full copy of the land title when they list, so PLT can check the lot details,
        caveats, charges and any restriction in interest before the land reaches buyers. Those documents
        stay with PLT and are never published.
      </p>

      <h3 className="font-display text-lg font-bold text-[#0E3B2E] mt-9">For buyers</h3>
      <Langkah items={LANGKAH_PEMBELI} />

      <h3 className="font-display text-lg font-bold text-[#0E3B2E] mt-8">For land owners</h3>
      <Langkah items={LANGKAH_PENJUAL} />

      {!isLoggedIn && (
        <div className="mt-8 bg-[#0E3B2E] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-display font-bold text-lg">Create a free account</p>
            <p className="text-white/70 text-sm mt-1 max-w-md">
              Save land to your favorites, follow up with PLT, and list your own land when you are ready.
            </p>
          </div>
          <Link
            href="/geran/log-masuk?redirect=%2Fgeran"
            className="inline-flex shrink-0 bg-white text-[#0E3B2E] font-bold px-5 py-2.5 rounded-full text-sm hover:-translate-y-0.5 transition"
          >
            Sign Up / Log In
          </Link>
        </div>
      )}

      <p className="text-xs text-[#0E3B2E]/40 mt-6 max-w-3xl leading-relaxed">
        GERAN publishes listings for information. PLT reviews what sellers submit but does not act as a
        party to any sale — always verify the title and get your own legal advice before a transaction.
      </p>
    </section>
  );
}
