"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Laman /geran/** sengaja tak papar Header/Footer PLT (brown) - ia ada
// identiti & nav sendiri (lihat components/geran/GeranBrandHeader.tsx &
// GeranFooter.tsx) supaya rasa macam produk berasingan, bukan sebahagian
// tampak laman utama tanahmalaya.org.
//
// `isGeranDomain` datang dari root layout (Server Component, baca host
// header) sebab middleware rewrite gerantanah.com/ -> /geran tak ubah
// usePathname() client-side (ia kekal "/", ikut path asal browser).
export default function ConditionalChrome({
  children,
  isGeranDomain,
}: {
  children: React.ReactNode;
  isGeranDomain?: boolean;
}) {
  const pathname = usePathname();
  const isGeran = isGeranDomain || pathname?.startsWith("/geran");

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
