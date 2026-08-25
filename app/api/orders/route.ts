export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_MERCHANDISE } from "@/lib/bayarcash";
import { calculateShipping } from "@/lib/pricing";
import { z } from "zod";

const schema = z.object({
  productId: z.string().min(1),
  kuantiti: z.coerce.number().int().min(1),
  namaPembeli: z.string().min(2),
  emel: z.string().email(),
  telefon: z.string().min(9),
  alamat: z.string().min(5),
  poskod: z.string().regex(/^\d{5}$/, "Poskod mesti 5 digit"),
  bandar: z.string().min(2),
  negeri: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    productId: form.get("productId"),
    kuantiti: form.get("kuantiti"),
    namaPembeli: form.get("namaPembeli"),
    emel: form.get("emel"),
    telefon: form.get("telefon"),
    alamat: form.get("alamat"),
    poskod: form.get("poskod"),
    bandar: form.get("bandar"),
    negeri: form.get("negeri"),
  });

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product || !product.aktif) {
    return NextResponse.json({ error: "Produk tidak ditemui" }, { status: 404 });
  }
  if (product.stok < data.kuantiti) {
    return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
  }

  const hargaBarangSen = product.hargaSen * data.kuantiti;
  const { shippingSen, courierName, serviceId } = await calculateShipping(
    product,
    data.kuantiti,
    data.poskod,
    data.negeri
  );
  const jumlahSen = hargaBarangSen + shippingSen;

  const order = await prisma.order.create({
    data: {
      namaPembeli: data.namaPembeli,
      emel: data.emel,
      telefon: data.telefon,
      alamat: data.alamat,
      poskod: data.poskod,
      bandar: data.bandar,
      negeri: data.negeri,
      jumlahSen,
      shippingSen,
      courierName,
      serviceId,
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
    returnPath: "/merchandise/berjaya",
  });

  return NextResponse.json({ url: intent.url });
}
