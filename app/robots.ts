import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isGeranHostname } from "@/lib/geran-domain";

// gerantanah.com dan tanahmalaya.org kongsi app ni tapi ialah dua "laman"
// berasingan (lihat middleware.ts) - robots.txt kena beza ikut host,
// terutamanya sitemap URL, supaya crawler tak disuruh baca sitemap domain
// lain (tak sah dari segi robots.txt spec, dan buat gerantanah.com punya
// listing tak dijumpai Google).
export default function robots(): MetadataRoute.Robots {
  const hostname = (headers().get("host") || "").split(":")[0];

  if (isGeranHostname(hostname)) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/jual", "/favorite", "/log-masuk"],
      },
      sitemap: "https://gerantanah.com/sitemap.xml",
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cart", "/keahlian/semak", "/keahlian/semak-plt", "/semak"],
    },
    sitemap: "https://tanahmalaya.org/sitemap.xml",
  };
}
