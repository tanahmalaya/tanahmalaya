import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// 1. Import CartProvider (sesuai path fail context anda)
import { CartProvider } from "@/app/context/CartContext";
import { CheckoutProvider } from "@/app/context/CheckoutContext";

export const metadata: Metadata = {
  title: "Pertubuhan Literasi Tanah | tanahmalaya.org",
  description:
    "Pertubuhan Literasi Tanah komited untuk mendidik masyarakat tentang hak milik, undang-undang tanah dan p",
  metadataBase: new URL("https://tanahmalaya.org"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body>
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