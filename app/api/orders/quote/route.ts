export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShipping } from "@/lib/pricing";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().min(1),
  kuantiti: z.coerce.number().int().min(1),
});

const schema = z.object({
  items: z.array(itemSchema).min(1, "Troli kosong"),
  poskod: z.string().regex(/^\d{5}$/, "Poskod mesti 5 digit"),
  negeri: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = schema.parse(body);

  let subtotalSen = 0;
  let shippingSen = 0;
  let courierName: string | null = null;
  const items: { id: string; namaProduk: string; kuantiti: number; hargaBarangSen: number }[] = [];

  for (const it of data.items) {
    const product = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!product || !product.aktif) {
      return NextResponse.json({ error: "Salah satu produk dalam troli tidak lagi tersedia" }, { status: 404 });
    }
    if (product.stok < it.kuantiti) {
      return NextResponse.json({ error: `Stok tidak mencukupi untuk ${product.nama}` }, { status: 400 });
    }

    const hargaBarangSen = product.hargaSen * it.kuantiti;
    subtotalSen += hargaBarangSen;

    const shipping = await calculateShipping(product, it.kuantiti, data.poskod, data.negeri);
    shippingSen += shipping.shippingSen;
    if (shipping.courierName) courierName = shipping.courierName;

    items.push({
      id: product.id,
      namaProduk: product.nama,
      kuantiti: it.kuantiti,
      hargaBarangSen,
    });
  }

  return NextResponse.json({
    items,
    subtotalSen,
    shippingSen,
    jumlahSen: subtotalSen + shippingSen,
    courierName,
  });
}
