import Link from "next/link";
import { GERAN_BTN_PRIMARY_INLINE } from "@/components/geran/theme";

// Actions on the right of GeranBrandHeader. A logged-out visitor previously
// had no way in at all - the only route to /geran/log-masuk was clicking a
// favorite heart or "List Your Land" and getting redirected.
export default function GeranAccountNav({
  isLoggedIn,
  redirectPath,
}: {
  isLoggedIn: boolean;
  redirectPath: string;
}) {
  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <Link
          href={`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`}
          className="text-sm font-semibold text-[#0E3B2E]/60 hover:text-[#0E3B2E] whitespace-nowrap"
        >
          Log In
        </Link>
        <Link href="/geran/jual" className={GERAN_BTN_PRIMARY_INLINE}>
          <span className="sm:hidden">+ List</span>
          <span className="hidden sm:inline">+ List Your Land</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
      <Link
        href="/geran/favorite"
        className="text-sm font-semibold text-[#0E3B2E]/60 hover:text-[#0E3B2E] whitespace-nowrap"
        aria-label="Favorite"
      >
        ❤<span className="hidden sm:inline"> Favorite</span>
      </Link>
      <form action="/api/sellers/logout" method="POST" className="flex">
        <button
          type="submit"
          className="text-sm font-semibold text-[#0E3B2E]/45 hover:text-[#0E3B2E] whitespace-nowrap"
        >
          Log Out
        </button>
      </form>
      <Link href="/geran/jual" className={GERAN_BTN_PRIMARY_INLINE}>
        <span className="sm:hidden">+ List</span>
        <span className="hidden sm:inline">+ List Your Land</span>
      </Link>
    </div>
  );
}
