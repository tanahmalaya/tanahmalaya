export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_MERCHANDISE } from "@/lib/bayarcash";
import { calculateShipping, AlamatTidakSahError } from "@/lib/pricing";
import { SIZE_LABEL } from "@/lib/productSize";
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
  // kepada satu produk (productId/kuantiti/saiz) kalau beli terus tanpa troli.
  const cartRaw = form.get("cart");
  let cartItems: { productId: string; quantity: number; saiz: string | null }[] = [];

  if (cartRaw) {
    try {
      const parsed = JSON.parse(String(cartRaw));
      if (Array.isArray(parsed) && parsed.length > 0) {
        cartItems = parsed.map((it: any) => ({
          productId: it.productId,
          quantity: it.quantity,
          saiz: it.saiz ?? null,
        }));
      }
    } catch {
      // abaikan, guna fallback di bawah
    }
  }

  if (cartItems.length === 0) {
    const productId = form.get("productId");
    const kuantiti = form.get("kuantiti");
    const saiz = form.get("saiz");
    if (!productId) {
      return NextResponse.json({ error: "Troli kosong" }, { status: 400 });
    }
    cartItems = [{ productId: String(productId), quantity: Number(kuantiti || 1), saiz: saiz ? String(saiz) : null }];
  }

  let subtotalSen = 0;
  let shippingSen = 0;
  let courierName: string | null = null;
  let serviceId: string | null = null;
  const orderItemsData: {
    productId: string;
    productSizeId: string | null;
    saiz: "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | null;
    kuantiti: number;
    hargaSen: number;
  }[] = [];
  const descParts: string[] = [];

  for (const ci of cartItems) {
    const product = await prisma.product.findUnique({ where: { id: ci.productId }, include: { sizes: true } });
    if (!product || !product.aktif) {
      return NextResponse.json({ error: "Salah satu produk dalam troli tidak lagi tersedia" }, { status: 404 });
    }

    // PREORDER dibuat ikut tempahan - stok tak sekat kuantiti/pembelian.
    const isPreorder = product.status === "PREORDER";

    let productSizeId: string | null = null;
    let saizLabel: string | null = null;
    if (product.sizes.length > 0) {
      const size = product.sizes.find((s) => s.saiz === ci.saiz);
      if (!size) {
        return NextResponse.json({ error: `Sila pilih saiz untuk ${product.nama}` }, { status: 400 });
      }
      if (!isPreorder && size.stok < ci.quantity) {
        return NextResponse.json(
          { error: `Stok tidak mencukupi untuk ${product.nama} (Saiz: ${SIZE_LABEL[size.saiz]})` },
          { status: 400 }
        );
      }
      productSizeId = size.id;
      saizLabel = size.saiz;
    } else if (!isPreorder && product.stok < ci.quantity) {
      return NextResponse.json({ error: `Stok tidak mencukupi untuk ${product.nama}` }, { status: 400 });
    }

    subtotalSen += product.hargaSen * ci.quantity;

    let shipping;
    try {
      shipping = await calculateShipping(product, ci.quantity, data.poskod, data.negeri);
    } catch (e) {
      if (e instanceof AlamatTidakSahError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
    shippingSen += shipping.shippingSen;
    if (shipping.courierName) courierName = shipping.courierName;
    if (shipping.serviceId) serviceId = shipping.serviceId;

    orderItemsData.push({
      productId: product.id,
      productSizeId,
      saiz: saizLabel as "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | null,
      kuantiti: ci.quantity,
      hargaSen: product.hargaSen,
    });
    descParts.push(`${product.nama}${saizLabel ? ` (${SIZE_LABEL[saizLabel]})` : ""} x${ci.quantity}`);
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
