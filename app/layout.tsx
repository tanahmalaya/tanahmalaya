import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pertubuhan Literasi Tanah | tanahmalaya.org",
  description:
    "Pertubuhan Literasi Tanah komited untuk meningkatkan kesedaran masyarakat tentang hak milik, undang-undang tanah dan pemilikan harta secara sah dan berilmu.",
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
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
