export const dynamic = "force-dynamic";

import ProductGrid from "@/components/ProductGrid";
import BackButton from "@/components/BackButton";

export default function MerchandisePage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
        <h1 className="font-display text-3xl font-bold">Merchandise</h1>
        <p className="text-brand-dark/70 mt-2">Sokong pertubuhan sambil menyokong gaya anda.</p>
      </div>
      <ProductGrid />
    </section>
  );
}
