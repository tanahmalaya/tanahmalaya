"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Laman /geran/** sengaja tak papar Header/Footer PLT (brown) - ia ada
// identiti & nav sendiri (lihat components/geran/GeranBrandHeader.tsx &
// GeranFooter.tsx) supaya rasa macam produk berasingan, bukan sebahagian
// tampak laman utama tanahmalaya.org.
export default function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGeran = pathname?.startsWith("/geran");

  if (isGeran) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
