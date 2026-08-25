export const dynamic = "force-dynamic";

import Link from "next/link";

export default function MerchandiseBerjayaPage() {
  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold mb-4">Terima Kasih Atas Pembelian!</h1>
      <p className="text-brand-dark/70 mb-8">
        Pembayaran Tuan sedang diproses. Pesanan akan disahkan secara automatik
        sebaik pengesahan diterima daripada BayarCash, dan bungkusan akan
        dihantar ke alamat yang Tuan berikan. Sila semak e-mel Tuan untuk
        resit pembayaran dan kemas kini penghantaran.
      </p>
      <Link
        href="/merchandise"
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm inline-block"
      >
        KEMBALI KE KEDAI
      </Link>
    </section>
  );
}
