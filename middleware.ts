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

  if (pathname.startsWith("/geran")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/geran" : `/geran${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
