import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// 1. Import CartProvider (sesuai path fail context anda)
import { CartProvider } from "@/app/context/CartContext";
import { CheckoutProvider } from "@/app/context/CheckoutContext";

const SITE_NAME = "Pertubuhan Literasi Tanah";
const SITE_DESCRIPTION =
  "Pertubuhan Literasi Tanah (PLT) komited untuk mendidik masyarakat Malaysia tentang hak milik, undang-undang tanah dan pengurusan harta secara sah dan berilmu. Sertai kelas, seminar dan program kembara ilmu kami.";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | tanahmalaya.org`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://tanahmalaya.org"),
  keywords: [
    "literasi tanah",
    "hak milik tanah",
    "undang-undang tanah Malaysia",
    "geran hakmilik",
    "pusaka tanah",
    "hibah",
    "pecah sempadan tanah",
    "kelas tanah",
    "Pertubuhan Literasi Tanah",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: "https://tanahmalaya.org",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | tanahmalaya.org`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.png", width: 1600, height: 1600, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} | tanahmalaya.org`,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "gViGCaJNc6ub03gdTyl2IJMDXx2opGnluRHhT3HF-5M",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: SITE_NAME,
  alternateName: "PLT",
  url: "https://tanahmalaya.org",
  logo: "https://tanahmalaya.org/logo.png",
  description: SITE_DESCRIPTION,
  email: "info@tanahmalaya.org",
  sameAs: ["https://web.facebook.com/profile.php?id=61592322463148"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: "https://tanahmalaya.org",
};

const siteNavigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: [
    "Tentang Kami",
    "Keahlian",
    "Program & Kelas",
    "Merchandise",
    "Aktiviti",
    "Semak Banjir",
    "Hubungi Kami",
  ],
  url: [
    "https://tanahmalaya.org/tentang-kami",
    "https://tanahmalaya.org/keahlian",
    "https://tanahmalaya.org/kelas-tanah",
    "https://tanahmalaya.org/merchandise",
    "https://tanahmalaya.org/aktiviti",
    "https://tanahmalaya.org/banjir",
    "https://tanahmalaya.org/hubungi-kami",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
        />
        {/* 2. Wrap semua kandungan di dalam CartProvider */}
        <CartProvider>
          <CheckoutProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </CheckoutProvider>
        </CartProvider>
      </body>
    </html>
  );
}