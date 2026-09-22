import type { Metadata } from "next";

// Metadata lalai untuk SEMUA halaman bawah /geran (direktori, jual, akaun,
// privasi, admin). Tanpa layout ni, halaman yang tak tetapkan openGraph
// sendiri jatuh ke root layout tanahmalaya.org - jadi pratonton pautan
// WhatsApp/FB papar logo & nama PLT walaupun pautan itu gerantanah.com.
//
// Nota: Next TIDAK gabung openGraph secara dalam. Halaman yang tetapkan
// openGraph sendiri (cth /geran dan /geran/[id]) menggantikan blok ni
// sepenuhnya, bukan menampalnya.
const GERAN_LOGO = "https://gerantanah.com/geran-logo-g.jpeg";

export const metadata: Metadata = {
  // Supaya URL relatif dalam metadata halaman anak selesai ke gerantanah.com,
  // bukan tanahmalaya.org seperti root layout.
  metadataBase: new URL("https://gerantanah.com"),
  title: {
    default: "GERAN",
    template: "%s | GERAN",
  },
  openGraph: {
    type: "website",
    locale: "ms_MY",
    siteName: "GERAN",
    title: "GERAN",
    description: "Marketplace tanah bergeran di Malaysia, dikendalikan Pertubuhan Literasi Tanah.",
    images: [{ url: GERAN_LOGO, alt: "GERAN" }],
  },
  twitter: {
    card: "summary",
    title: "GERAN",
    images: [GERAN_LOGO],
  },
};

export default function GeranLayout({ children }: { children: React.ReactNode }) {
  return children;
}
