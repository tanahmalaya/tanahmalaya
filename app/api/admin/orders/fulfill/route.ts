export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { submitEasyParcelOrder } from "@/lib/easyparcel";

const MAX_BULK = 30;

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = (body.orderIds || []).slice(0, MAX_BULK);

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const orderId of orderIds) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order || order.status !== "BERJAYA" || order.trackingNumber) {
      results.push({ id: orderId, success: false, error: "Order tidak sah untuk fulfill" });
      continue;
    }

    try {
      const totalBeratKg =
        order.items.reduce((sum, item) => sum + (item.product.beratGram ?? 500) * item.kuantiti, 0) / 1000;
      const kandungan = order.items.map((item) => `${item.product.nama} x${item.kuantiti}`).join(", ");
      const nilaiRM = order.jumlahSen / 100;
      const serviceId = order.serviceId || process.env.EASYPARCEL_DEFAULT_SERVICE_ID || "";

      if (!serviceId) {
        throw new Error("Tiada service_id - semak tetapan penghantaran produk");
      }

      const booking = await submitEasyParcelOrder({
        receiverName: order.namaPembeli,
        receiverPhone: order.telefon,
        receiverAddress: order.alamat,
        receiverPostcode: order.poskod,
        receiverCity: order.bandar,
        receiverState: order.negeri,
        weightKg: totalBeratKg,
        serviceId,
        content: kandungan,
        valueRM: nilaiRM,
      });

      if (booking.success && booking.trackingNumber) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            easyparcelOrderNo: booking.orderNo,
            trackingNumber: booking.trackingNumber,
            courierName: booking.courierName ?? order.courierName,
            fulfillmentError: null,
          },
        });
        results.push({ id: orderId, success: true });
      } else {
        throw new Error("EasyParcel tidak pulangkan tracking number");
      }
    } catch (e) {
      const message = (e as Error).message;
      await prisma.order.update({
        where: { id: order.id },
        data: { fulfillmentError: message },
      });
      results.push({ id: orderId, success: false, error: message });
    }
  }

  return NextResponse.json({ results });
}
