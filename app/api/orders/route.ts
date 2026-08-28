export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_MERCHANDISE } from "@/lib/bayarcash";
import { calculateShipping } from "@/lib/pricing";
import { z } from "zod";

const infoSchema = z.object({
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
  const data = infoSchema.parse({
    namaPembeli: form.get("namaPembeli"),
    emel: form.get("emel"),
    telefon: form.get("telefon"),
    alamat: form.get("alamat"),
    poskod: form.get("poskod"),
    bandar: form.get("bandar"),
    negeri: form.get("negeri"),
  });

  // Ambil senarai barangan dari troli (field "cart", JSON), atau fallback
  // kepada satu produk (productId/kuantiti) kalau beli terus tanpa troli.
  const cartRaw = form.get("cart");
  let cartItems: { id: string; quantity: number }[] = [];

  if (cartRaw) {
    try {
      const parsed = JSON.parse(String(cartRaw));
      if (Array.isArray(parsed) && parsed.length > 0) {
        cartItems = parsed.map((it: any) => ({ id: it.id, quantity: it.quantity }));
      }
    } catch {
      // abaikan, guna fallback di bawah
    }
  }

  if (cartItems.length === 0) {
    const productId = form.get("productId");
    const kuantiti = form.get("kuantiti");
    if (!productId) {
      return NextResponse.json({ error: "Troli kosong" }, { status: 400 });
    }
    cartItems = [{ id: String(productId), quantity: Number(kuantiti || 1) }];
  }

  let subtotalSen = 0;
  let shippingSen = 0;
  let courierName: string | null = null;
  let serviceId: string | null = null;
  const orderItemsData: { productId: string; kuantiti: number; hargaSen: number }[] = [];
  const descParts: string[] = [];

  for (const ci of cartItems) {
    const product = await prisma.product.findUnique({ where: { id: ci.id } });
    if (!product || !product.aktif) {
      return NextResponse.json({ error: "Salah satu produk dalam troli tidak lagi tersedia" }, { status: 404 });
    }
    if (product.stok < ci.quantity) {
      return NextResponse.json({ error: `Stok tidak mencukupi untuk ${product.nama}` }, { status: 400 });
    }

    subtotalSen += product.hargaSen * ci.quantity;

    const shipping = await calculateShipping(product, ci.quantity, data.poskod, data.negeri);
    shippingSen += shipping.shippingSen;
    if (shipping.courierName) courierName = shipping.courierName;
    if (shipping.serviceId) serviceId = shipping.serviceId;

    orderItemsData.push({
      productId: product.id,
      kuantiti: ci.quantity,
      hargaSen: product.hargaSen,
    });
    descParts.push(`${product.nama} x${ci.quantity}`);
  }

  const jumlahSen = subtotalSen + shippingSen;

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
      items: { create: orderItemsData },
    },
  });

  const intent = await createBayarcashPaymentIntent({
    portalKey: BAYARCASH_PORTAL_MERCHANDISE,
    orderId: order.id,
    amountSen: jumlahSen,
    payerName: data.namaPembeli,
    payerEmail: data.emel,
    payerPhone: data.telefon,
    description: `Pembelian ${descParts.join(", ")} - PLT`.slice(0, 250),
    returnPath: "/merchandise/berjaya",
  });

  return NextResponse.json({ url: intent.url });
}
