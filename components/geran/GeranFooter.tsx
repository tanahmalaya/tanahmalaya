import Link from "next/link";
import GeranLogo from "@/components/geran/GeranLogo";

// Standalone footer for /geran - deliberately not using the main Footer.tsx
// so this section feels like a separate product. Keeps one small line
// linking back to tanahmalaya.org for transparency (Contact PLT, reviews,
// etc. are all still handled by PLT), without making the overall design
// look like the main site.
export default function GeranFooter() {
  return (
    <footer className="bg-[#0E3B2E] text-white/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2.5">
          <GeranLogo size={28} />
          <span className="font-display font-bold text-white tracking-tight">GERAN</span>
        </div>
        <p className="text-xs max-w-sm leading-relaxed">
          Operated by{" "}
          <Link href="https://tanahmalaya.org" className="underline hover:text-white">
            Pertubuhan Literasi Tanah
          </Link>
          . Every listing is reviewed &amp; verified before publishing.
        </p>
        <Link href="/geran/privasi" className="text-xs underline hover:text-white">
          Privacy Notice
        </Link>
        <p className="text-[11px] text-white/40">© {new Date().getFullYear()} GERAN</p>
      </div>
    </footer>
  );
}
