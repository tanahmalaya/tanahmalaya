import Link from "next/link";
import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";

// 404 untuk semua notFound() di bawah /geran. Tanpa fail ni Next jatuh ke 404
// root - dengan tajuk tab "... | Pertubuhan Literasi Tanah" walaupun pelawat
// berada di gerantanah.com, sedangkan GERAN tiada kaitan dengan PLT.
export default function GeranNotFound() {
  return (
    <div className="bg-[#F6F4EE] min-h-screen flex flex-col">
      <GeranBrandHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0E3B2E]/40">404</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0E3B2E] mt-2">
          This listing is not available
        </h1>
        <p className="text-[#0E3B2E]/60 mt-2 max-w-md">
          It may have been sold, removed, or the link is incorrect.
        </p>
        <Link
          href="/geran"
          className="mt-6 inline-flex bg-[#0E3B2E] text-white font-bold px-5 py-2.5 rounded-full text-sm"
        >
          Browse titled land
        </Link>
      </main>
      <GeranFooter />
    </div>
  );
}
