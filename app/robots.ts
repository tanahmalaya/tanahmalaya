import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cart", "/keahlian/semak", "/keahlian/semak-plt", "/semak"],
    },
    sitemap: "https://tanahmalaya.org/sitemap.xml",
  };
}
