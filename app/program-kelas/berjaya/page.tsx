export const dynamic = "force-dynamic";

import Link from "next/link";

export default function ProgramBerjayaPage() {
  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold mb-4">Pendaftaran Diterima!</h1>
      <p className="text-brand-dark/70 mb-8">
        Terima kasih kerana mendaftar. Sila semak e-mel Tuan untuk pengesahan
        dan maklumat lanjut mengenai kelas/program ini.
      </p>
      <Link
        href="/kelas-tanah"
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm inline-block"
      >
        KEMBALI KE SENARAI PROGRAM
      </Link>
    </section>
  );
}
