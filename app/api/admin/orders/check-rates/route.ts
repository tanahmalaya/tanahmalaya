export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { listEasyParcelRates } from "@/lib/easyparcel";

// Senaraikan SEMUA kurier & kadar tersedia untuk destinasi order tertentu -
// digunakan staff untuk pilih kurier manual bila SPX & J&T dua-dua tak
// tersedia (order.manualCourier === true).
export async function GET(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
  }

  const totalBeratKg =
    order.items.reduce((sum, item) => sum + (item.product.beratGram ?? 500) * item.kuantiti, 0) / 1000;

  const rates = await listEasyParcelRates({
    destPostcode: order.poskod,
    destState: order.negeri,
    weightKg: totalBeratKg,
  });

  return NextResponse.json({ rates });
}
