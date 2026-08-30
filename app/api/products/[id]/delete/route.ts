export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  try {
    await prisma.product.delete({ where: { id: params.id } });
  } catch (e) {
    // Kemungkinan besar sebab produk ni masih ada dalam rekod tempahan (OrderItem)
    // - Prisma/Postgres tolak padam disebabkan foreign key.
    return NextResponse.redirect(
      new URL(
        `/admin/products?error=${encodeURIComponent(
          "Tidak boleh padam - produk ini sudah ada dalam rekod tempahan pelanggan. Set 'Aktif' kepada 'Tidak' (Edit) untuk sembunyikan dari laman merchandise tanpa memadam rekod tempahan lama."
        )}`,
        req.url
      )
    );
  }

  return NextResponse.redirect(new URL("/admin/products", req.url));
}
