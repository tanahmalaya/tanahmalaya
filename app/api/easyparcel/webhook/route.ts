export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// EasyParcel akan POST ke sini bila status tracking parcel berubah.
// Rujuk: https://documenter.getpostman.com/view/10519343/TVRpz4zC (topic "tracking/create")
//
// Contoh payload:
// {
//   "topic": "tracking/create",
//   "payload": {
//     "awb": "ABC001",
//     "event_date": "2020-07-09T16:04:39.000Z",
//     "description": "Parcel has been collected",
//     "status_code": 4,
//     "location": "Puchong",
//     ...
//   },
//   "event_id": "..."
// }
//
// Topic "ondemand/tracking" (untuk penghantaran rider on-demand, bukan kurier
// biasa) guna struktur berbeza - "order_number" + "status" (string) + "update_at".
// Kita sokong dua-dua sebab tak pasti topic mana staff/admin daftarkan.

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.EASYPARCEL_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.topic || !body?.payload) {
    return NextResponse.json({ error: "Payload tidak sah" }, { status: 400 });
  }

  const { topic, payload } = body;
  console.log(`[EasyParcel Webhook] topic=${topic}`, JSON.stringify(payload));

  let order = null;

  if (topic === "tracking/create" || topic === "shipment/create") {
    const awb = payload.awb;
    if (awb) {
      order = await prisma.order.findFirst({ where: { trackingNumber: awb } });
    }
  } else if (topic === "ondemand/tracking") {
    const orderNumber = payload.order_number;
    if (orderNumber) {
      order = await prisma.order.findFirst({ where: { easyparcelOrderNo: orderNumber } });
    }
  }

  if (!order) {
    // Tak jumpa order padanan - masih pulangkan 200 supaya EasyParcel tak retry
    // (order mungkin bukan dari sistem kita, atau AWB/order_number tak match lagi).
    return NextResponse.json({ ok: true, matched: false });
  }

  const statusText: string | null = payload.description ?? payload.status ?? null;
  const statusAt: Date | null = payload.event_date
    ? new Date(payload.event_date)
    : payload.update_at
      ? new Date(payload.update_at)
      : new Date();

  await prisma.order.update({
    where: { id: order.id },
    data: {
      courierStatus: statusText,
      courierStatusAt: statusAt,
    },
  });

  return NextResponse.json({ ok: true, matched: true });
}
