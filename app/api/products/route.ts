export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({ where: { aktif: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const hargaRM = parseFloat(String(form.get("harga")));
  const shippingMode = String(form.get("shippingMode") || "FLAT") as "FLAT" | "BERAT";
  const shippingFlatRM = form.get("shippingFlatRM");
  const beratGram = form.get("beratGram");

  await prisma.product.create({
    data: {
      nama: String(form.get("nama")),
      penerangan: String(form.get("penerangan") || "") || null,
      hargaSen: Math.round(hargaRM * 100),
      stok: parseInt(String(form.get("stok")), 10),
      gambarDepan: String(form.get("gambarDepan") || "") || null,
      gambarBelakang: String(form.get("gambarBelakang") || "") || null,
      gambarSisi: String(form.get("gambarSisi") || "") || null,
      sizingChartUrl: String(form.get("sizingChartUrl") || "") || null,
      shippingMode,
      shippingFlatSen: shippingFlatRM ? Math.round(parseFloat(String(shippingFlatRM)) * 100) : null,
      beratGram: beratGram ? parseInt(String(beratGram), 10) : null,
    },
  });

  return NextResponse.redirect(new URL("/admin/products", req.url));
}