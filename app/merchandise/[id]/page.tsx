export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartWidget from "@/components/AddToCartWidget";
import BackButton from "@/components/BackButton";
import ProductGallery from "@/components/ProductGallery";
import CrossSellGrid from "@/components/CrossSellGrid";
import { PRODUCT_STATUS_LABEL, SIZE_LABEL, isAvailableForOrder, totalStok } from "@/lib/productSize";

function formatHarga(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { sizes: true },
  });
  if (!product || !product.aktif) return notFound();

  const barangLain = await prisma.product.findMany({
    where: { aktif: true, id: { not: product.id } },
    orderBy: { createdAt: "desc" },
    include: { sizes: true },
  });

  const gallery = [product.gambarDepan, product.gambarBelakang, product.gambarSisi].filter(
    (url): url is string => Boolean(url)
  );
  const stok = totalStok(product);
  const tersedia = isAvailableForOrder(product);
  const sizes = product.sizes.map((s) => ({ saiz: s.saiz, label: SIZE_LABEL[s.saiz] || s.saiz, stok: s.stok }));

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 md:py-16">
      <BackButton href="/merchandise" label="Kembali ke Merchandise" className="mb-6" />

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <ProductGallery images={gallery} productName={product.nama} />
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
              {product.status === "PREORDER"
                ? "Pre-order - dibuat ikut tempahan"
                : `Stok: ${stok > 0 ? `${stok} tersedia` : "Habis stok"}`}
            </p>
          )}

          {tersedia ? (
            <AddToCartWidget
              productId={product.id}
              nama={product.nama}
              price={product.hargaSen / 100}
              stok={product.stok}
              status={product.status}
              sizes={sizes}
            />
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
      </div>

      <CrossSellGrid products={barangLain} />
    </section>
  );
}
