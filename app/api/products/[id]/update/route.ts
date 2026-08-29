export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseSizesFromForm } from "@/lib/productSize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const hargaRM = parseFloat(String(form.get("harga")));
  const status = String(form.get("status") || "READY_STOCK") as "READY_STOCK" | "PREORDER";
  const shippingMode = String(form.get("shippingMode") || "FLAT") as "FLAT" | "BERAT";
  const shippingFlatRM = form.get("shippingFlatRM");
  const beratGram = form.get("beratGram");
  const stokInput = form.get("stok");
  const aktif = String(form.get("aktif") || "true") === "true";
  const sizes = parseSizesFromForm(form);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: params.id },
      data: {
        nama: String(form.get("nama")),
        penerangan: String(form.get("penerangan") || "") || null,
        hargaSen: Math.round(hargaRM * 100),
        status,
        stok: sizes.length > 0 ? 0 : parseInt(String(stokInput || "0"), 10) || 0,
        aktif,
        gambarDepan: String(form.get("gambarDepan") || "") || null,
        gambarBelakang: String(form.get("gambarBelakang") || "") || null,
        gambarSisi: String(form.get("gambarSisi") || "") || null,
        sizingChartUrl: String(form.get("sizingChartUrl") || "") || null,
        shippingMode,
        shippingFlatSen: shippingFlatRM ? Math.round(parseFloat(String(shippingFlatRM)) * 100) : null,
        beratGram: beratGram ? parseInt(String(beratGram), 10) : null,
      },
    });

    // Upsert saiz yang dihantar, padam saiz yang dibuang daripada borang.
    for (const s of sizes) {
      await tx.productSize.upsert({
        where: { productId_saiz: { productId: params.id, saiz: s.saiz } },
        update: { stok: s.stok },
        create: { productId: params.id, saiz: s.saiz, stok: s.stok },
      });
    }
    await tx.productSize.deleteMany({
      where: {
        productId: params.id,
        saiz: { notIn: sizes.map((s) => s.saiz) },
      },
    });
  });

  return NextResponse.redirect(new URL("/admin/products", req.url));
}
