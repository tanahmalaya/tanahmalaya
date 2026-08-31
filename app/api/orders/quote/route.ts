export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShipping, AlamatTidakSahError } from "@/lib/pricing";
import { SIZE_LABEL } from "@/lib/productSize";
import { isJaket, diskaunPercentUntuk, hargaSelepasDiskaunSen } from "@/lib/promo";
import { Prisma } from "@prisma/client";
import { z } from "zod";

type ProductDenganSaiz = Prisma.ProductGetPayload<{ include: { sizes: true } }>;

const itemSchema = z.object({
  productId: z.string().min(1),
  kuantiti: z.coerce.number().int().min(1),
  saiz: z.string().nullish(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1, "Troli kosong"),
  poskod: z.string().regex(/^\d{5}$/, "Poskod mesti 5 digit"),
  negeri: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = schema.parse(body);

  const validated: { product: ProductDenganSaiz; namaProduk: string; kuantiti: number }[] = [];

  for (const it of data.items) {
    const product = await prisma.product.findUnique({ where: { id: it.productId }, include: { sizes: true } });
    if (!product || !product.aktif) {
      return NextResponse.json({ error: "Salah satu produk dalam troli tidak lagi tersedia" }, { status: 404 });
    }

    let namaProduk = product.nama;
    if (product.sizes.length > 0) {
      const size = product.sizes.find((s) => s.saiz === it.saiz);
      if (!size) {
        return NextResponse.json({ error: `Sila pilih saiz untuk ${product.nama}` }, { status: 400 });
      }
      if (size.stok < it.kuantiti) {
        return NextResponse.json(
          { error: `Stok tidak mencukupi untuk ${product.nama} (Saiz: ${SIZE_LABEL[size.saiz]})` },
          { status: 400 }
        );
      }
      namaProduk = `${product.nama} (Saiz: ${SIZE_LABEL[size.saiz]})`;
    } else if (product.stok < it.kuantiti) {
      return NextResponse.json({ error: `Stok tidak mencukupi untuk ${product.nama}` }, { status: 400 });
    }

    validated.push({ product, namaProduk, kuantiti: it.kuantiti });
  }

  // Promo jaket: kalau troli ada jaket, barangan lain (bukan jaket) dapat
  // diskaun automatik - 10% t-shirt, 5% barangan lain.
  const hasJaket = validated.some((v) => isJaket(v.product.nama));

  let subtotalSen = 0;
  let shippingSen = 0;
  let courierName: string | null = null;
  const items: {
    id: string;
    namaProduk: string;
    kuantiti: number;
    hargaBarangSen: number;
    hargaAsalSen: number;
    diskaunPercent: number;
  }[] = [];

  for (const v of validated) {
    const { product, namaProduk, kuantiti } = v;
    const diskaunPercent = diskaunPercentUntuk(product.nama, hasJaket);
    const hargaUnitSen = hargaSelepasDiskaunSen(product.hargaSen, diskaunPercent);
    const hargaBarangSen = hargaUnitSen * kuantiti;
    const hargaAsalSen = product.hargaSen * kuantiti;
    subtotalSen += hargaBarangSen;

    let shipping;
    try {
      shipping = await calculateShipping(product, kuantiti, data.poskod, data.negeri);
    } catch (e) {
      if (e instanceof AlamatTidakSahError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
    shippingSen += shipping.shippingSen;
    if (shipping.courierName) courierName = shipping.courierName;

    items.push({
      id: product.id,
      namaProduk,
      kuantiti,
      hargaBarangSen,
      hargaAsalSen,
      diskaunPercent,
    });
  }

  const diskaunSen = items.reduce((sum, it) => sum + (it.hargaAsalSen - it.hargaBarangSen), 0);

  return NextResponse.json({
    items,
    subtotalSen,
    diskaunSen,
    shippingSen,
    jumlahSen: subtotalSen + shippingSen,
    courierName,
  });
}
