import { prisma } from "@/lib/prisma";
import ProductGridClient from "./ProductGridClient";

export default async function ProductGrid() {
  const products = await prisma.product.findMany({
    where: { aktif: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { sizes: true },
  });

  return <ProductGridClient products={products} />;
}