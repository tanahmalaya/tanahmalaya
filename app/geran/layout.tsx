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
  // "absolute", bukan "default": tajuk segmen ini sendiri (cth. halaman 404
  // GERAN) akan dibungkus template root jadi "GERAN | Pertubuhan Literasi
  // Tanah" - jenama PLT yang tak patut muncul di gerantanah.com.
  title: {
    absolute: "GERAN",
    template: "%s | GERAN",
  },
  // Ganti keywords root layout - ia menyebut "Pertubuhan Literasi Tanah" dan
  // akan muncul dalam setiap halaman gerantanah.com kalau tak ditindih.
  keywords: [
    "tanah dijual",
    "titled land for sale",
    "tanah bergeran",
    "tanah pertanian dijual",
    "lot tanah",
    "Malaysia land for sale",
    "GeranTanah",
    "GERAN",
  ],
  openGraph: {
    type: "website",
    locale: "ms_MY",
    siteName: "GERAN",
    title: "GERAN",
    description: "Malaysia's marketplace for titled land, operated by GeranTanah (GT).",
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
