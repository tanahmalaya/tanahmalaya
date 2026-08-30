export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartWidget from "@/components/AddToCartWidget";
import { PRODUCT_STATUS_LABEL, SIZE_LABEL, totalStok } from "@/lib/productSize";

function formatHarga(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { sizes: true },
  });
  if (!product || !product.aktif) return notFound();

  const gallery = [product.gambarDepan, product.gambarBelakang, product.gambarSisi].filter(
    (url): url is string => Boolean(url)
  );
  const stok = totalStok(product);
  const sizes = product.sizes.map((s) => ({ saiz: s.saiz, label: SIZE_LABEL[s.saiz] || s.saiz, stok: s.stok }));

  return (
    <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
      <div>
        <div className={`grid gap-3 ${gallery.length <= 1 ? "grid-cols-1" : gallery.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {gallery.map((url, i) => (
            <div key={i} className="relative aspect-square bg-brand-cream rounded-md overflow-hidden">
              <Image src={url} alt={`${product.nama} - gambar ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="col-span-3 aspect-square bg-brand-cream rounded-md flex items-center justify-center text-brand-dark/40">
              Tiada gambar
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold mb-2">{product.nama}</h1>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-2xl text-brand-gold font-bold">{formatHarga(product.hargaSen)}</p>
          <span className="bg-brand-cream text-brand-dark text-xs font-semibold px-2 py-1 rounded-sm">
            {PRODUCT_STATUS_LABEL[product.status] || product.status}
          </span>
        </div>
        {product.penerangan && (
          <p className="text-brand-dark/70 mb-6 whitespace-pre-line">{product.penerangan}</p>
        )}
        {sizes.length === 0 && (
          <p className="text-sm text-brand-dark/60 mb-6">
            Stok: {stok > 0 ? `${stok} tersedia` : "Habis stok"}
          </p>
        )}

        {stok > 0 ? (
          <AddToCartWidget productId={product.id} nama={product.nama} price={product.hargaSen / 100} stok={product.stok} sizes={sizes} />
        ) : (
          <button disabled className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full opacity-50">
            HABIS STOK
          </button>
        )}

        {product.sizingChartUrl && (
          <div className="mt-10">
            <h2 className="font-semibold mb-3">Carta Saiz</h2>
            <div className="relative w-full aspect-video bg-brand-cream rounded-md overflow-hidden">
              <Image src={product.sizingChartUrl} alt="Carta Saiz" fill className="object-contain" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
