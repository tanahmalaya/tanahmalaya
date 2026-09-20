import type { Metadata } from "next";

// Setiap page kena declare openGraph/twitter sendiri - Next.js TAK auto
// gabungkan title/description page dengan openGraph root layout. Kalau
// page tak declare openGraph sendiri, ia terus warisi openGraph root
// (jenama + imej PLT) secara keseluruhan, jadi link preview WhatsApp/FB
// untuk page tu akan silap papar branding laman utama.
const SITE_NAME = "Pertubuhan Literasi Tanah";
const DEFAULT_IMAGE = "/logo.png";

export function pageMetadata({
  title,
  description,
  path,
  image,
  robots,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const ogTitle = `${title} | ${SITE_NAME}`;
  const ogImage = image || DEFAULT_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}
