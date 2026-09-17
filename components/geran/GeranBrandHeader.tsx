import Link from "next/link";
import type { ReactNode } from "react";
import GeranLogo from "@/components/geran/GeranLogo";

// Clean, minimal white navbar (broka.com.my style) - logo+wordmark on the
// left, actions (CTA/log out) on the right, sticky, subtle bottom border.
// Used on /geran, /geran/jual and /geran/log-masuk. Kept separate from the
// main Header.tsx (which stays for tanahmalaya.org's overall navigation).
export default function GeranBrandHeader({
  action,
  back,
}: {
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-black/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {back}
          <Link href="/geran" className="flex items-center gap-2.5 shrink-0">
            <GeranLogo size={34} />
            <span className="font-display font-extrabold text-lg text-[#0E3B2E] tracking-tight leading-none">
              GERAN
            </span>
          </Link>
        </div>
        {action}
      </div>
    </header>
  );
}
