export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_MERCHANDISE } from "@/lib/bayarcash";
import { z } from "zod";

const schema = z.object({
  productId: z.string().min(1),
  kuantiti: z.coerce.number().int().min(1),
  namaPembeli: z.string().min(2),
  emel: z.string().email(),
  telefon: z.string().min(9),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    productId: form.get("productId"),
    kuantiti: form.get("kuantiti"),
    namaPembeli: form.get("namaPembeli"),
    emel: form.get("emel"),
    telefon: form.get("telefon"),
  });

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product || !product.aktif) {
    return NextResponse.json({ error: "Produk tidak ditemui" }, { status: 404 });
  }
  if (product.stok < data.kuantiti) {
    return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
  }

  const jumlahSen = product.hargaSen * data.kuantiti;

  const order = await prisma.order.create({
    data: {
      namaPembeli: data.namaPembeli,
      emel: data.emel,
      telefon: data.telefon,
      jumlahSen,
      status: "MENUNGGU",
      items: {
        create: {
          productId: product.id,
          kuantiti: data.kuantiti,
          hargaSen: product.hargaSen,
        },
      },
    },
  });

  const intent = await createBayarcashPaymentIntent({
    portalKey: BAYARCASH_PORTAL_MERCHANDISE,
    orderId: order.id,
    amountSen: jumlahSen,
    payerName: data.namaPembeli,
    payerEmail: data.emel,
    payerPhone: data.telefon,
    description: `Pembelian ${product.nama} x${data.kuantiti} - PLT`,
  });

  return NextResponse.redirect(intent.url);
}
