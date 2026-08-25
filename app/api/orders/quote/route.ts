export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShipping } from "@/lib/pricing";
import { z } from "zod";

const schema = z.object({
  productId: z.string().min(1),
  kuantiti: z.coerce.number().int().min(1),
  poskod: z.string().regex(/^\d{5}$/, "Poskod mesti 5 digit"),
  negeri: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = schema.parse(body);

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product || !product.aktif) {
    return NextResponse.json({ error: "Produk tidak ditemui" }, { status: 404 });
  }
  if (product.stok < data.kuantiti) {
    return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
  }

  const hargaBarangSen = product.hargaSen * data.kuantiti;
  const { shippingSen, courierName } = await calculateShipping(
    product,
    data.kuantiti,
    data.poskod,
    data.negeri
  );

  return NextResponse.json({
    namaProduk: product.nama,
    hargaBarangSen,
    shippingSen,
    jumlahSen: hargaBarangSen + shippingSen,
    courierName,
  });
}
