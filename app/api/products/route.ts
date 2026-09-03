export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseSizesFromForm } from "@/lib/productSize";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { aktif: true },
    orderBy: { createdAt: "desc" },
    include: { sizes: true },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const hargaRM = parseFloat(String(form.get("harga")));
  const status = String(form.get("status") || "READY_STOCK") as "READY_STOCK" | "PREORDER";
  const beratGram = form.get("beratGram");
  const stokInput = form.get("stok");
  const sizes = parseSizesFromForm(form);

  await prisma.product.create({
    data: {
      nama: String(form.get("nama")),
      kodRingkas: String(form.get("kodRingkas") || "").trim().toUpperCase() || null,
      penerangan: String(form.get("penerangan") || "") || null,
      hargaSen: Math.round(hargaRM * 100),
      status,
      stok: sizes.length > 0 ? 0 : parseInt(String(stokInput || "0"), 10) || 0,
      gambarDepan: String(form.get("gambarDepan") || "") || null,
      gambarBelakang: String(form.get("gambarBelakang") || "") || null,
      gambarSisi: String(form.get("gambarSisi") || "") || null,
      sizingChartUrl: String(form.get("sizingChartUrl") || "") || null,
      shippingMode: "BERAT",
      beratGram: parseInt(String(beratGram), 10),
      sizes: sizes.length > 0 ? { create: sizes } : undefined,
    },
  });

  return NextResponse.redirect(new URL("/admin/products", req.url));
}
