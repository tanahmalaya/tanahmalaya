export const dynamic = "force-dynamic";

import Link from "next/link";

export const metadata = {
  title: "Sumbangan Berjaya",
  robots: { index: false, follow: false },
};

export default function SumbanganBerjayaPage() {
  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold mb-4">Terima Kasih Atas Sumbangan Anda!</h1>
      <p className="text-brand-dark/70 mb-8">
        Sumbangan Tuan sedang diproses. Sila semak e-mel Tuan untuk resit pembayaran sebaik
        pengesahan diterima daripada BayarCash.
      </p>
      <Link
        href="/"
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm inline-block"
      >
        KEMBALI KE LAMAN UTAMA
      </Link>
    </section>
  );
}
