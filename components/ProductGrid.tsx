import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

function formatHarga(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

export default async function ProductGrid() {
  const products = await prisma.product.findMany({
    where: { aktif: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-display text-2xl font-bold mb-6">MERCHANDISE TERKINI</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {products.map((p) => (
          <Link key={p.id} href={`/merchandise/${p.id}`} className="bg-white rounded-md shadow-sm overflow-hidden block">
            <div className="relative h-36 bg-brand-cream">
              {p.gambarDepan && <Image src={p.gambarDepan} alt={p.nama} fill className="object-cover" />}
            </div>
            <div className="p-4">
              <p className="font-semibold text-sm mb-1">{p.nama}</p>
              <p className="text-sm text-brand-dark/70 mb-3">{formatHarga(p.hargaSen)}</p>
              <span className="text-brand-gold text-xs font-bold">LIHAT PRODUK</span>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-brand-dark/50">
            Belum ada produk. Tambah dari dashboard admin.
          </p>
        )}
      </div>
    </section>
  );
}
