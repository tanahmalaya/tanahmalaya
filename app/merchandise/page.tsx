export const revalidate = 60;

import ProductGrid from "@/components/ProductGrid";

export default function MerchandisePage() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="font-display text-3xl font-bold">Merchandise</h1>
        <p className="text-brand-dark/70 mt-2">Sokong pertubuhan sambil menyokong gaya anda.</p>
      </div>
      <ProductGrid />
    </section>
  );
}
