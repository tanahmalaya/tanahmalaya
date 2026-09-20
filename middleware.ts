import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isGeranHostname } from "@/lib/geran-domain";

// gerantanah.com adalah domain berasingan untuk laman GERAN sahaja.
// Semua request ke domain ini di-rewrite supaya "/" memaparkan /geran
// dan sub-path lain memaparkan /geran/<path> yang sepadan.
export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0];

  if (!isGeranHostname(hostname)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Pelayar/bot yang minta /favicon.ico terus (tanpa baca <link rel="icon">)
  // patut dapat logo G, bukan logo PLT dalam public/favicon.ico.
  if (pathname === "/favicon.ico") {
    const url = request.nextUrl.clone();
    url.pathname = "/geran-favicon.ico";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/geran")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/geran" : `/geran${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // google*.html - fail verification Google Search Console (public/) kena
  // boleh dicapai betul-betul di root gerantanah.com, bukan di-rewrite ke
  // /geran/google....html (yang tak wujud & bagi 404).
  // favicon.ico TIDAK dikecualikan lagi kerana ia dikendali di atas.
  matcher: [
    "/((?!api|_next/static|_next/image|apple-icon.png|icon.png|manifest.webmanifest|robots.txt|sitemap.xml|google.*\.html).*)",
  ],
};
