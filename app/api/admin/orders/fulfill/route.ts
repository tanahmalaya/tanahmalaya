export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { submitEasyParcelOrder, checkEasyParcelRate } from "@/lib/easyparcel";

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

      // service_id yang disimpan masa checkout (atau default statik untuk
      // produk FLAT) boleh dah LUPUT sebab EasyParcel punya rate quote ada
      // tempoh sah terhad. Sebelum booking, semak kadar SEKALI LAGI sekarang
      // supaya service_id yang dipakai untuk booking sentiasa sah/terkini.
      // Cuba kekalkan kurier yang sama macam masa checkout (courierName
      // asal) supaya konsisten dengan apa yang customer nampak/bayar; kalau
      // kurier tu dah tak tersedia, fallback kepada kadar termurah semasa.
      const freshRate = await checkEasyParcelRate({
        destPostcode: order.poskod,
        destState: order.negeri,
        weightKg: totalBeratKg,
        preferCourierName: order.courierName,
      });

      const serviceId =
        freshRate?.serviceId || order.serviceId || process.env.EASYPARCEL_DEFAULT_SERVICE_ID || "";
      const courierNameGuna = freshRate?.courierName ?? order.courierName;

      if (!serviceId) {
        throw new Error("Tiada service_id - semak tetapan penghantaran produk atau destinasi tidak dilayan EasyParcel");
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
            courierName: booking.courierName ?? courierNameGuna,
            serviceId,
            fulfillmentError: null,
          },
        });
        results.push({ id: orderId, success: true });
      } else if (booking.success && !booking.trackingNumber) {
        // EasyParcel kata "berjaya" tapi kita tak jumpa tracking number
        // dalam respons - JANGAN retry automatik (risiko booking berganda).
        // Simpan order number (kalau ada) + respons mentah untuk semakan
        // manual oleh admin terus dalam dashboard EasyParcel.
        throw new Error(
          `EasyParcel kata BERJAYA (order_number: ${booking.orderNo ?? "?"}) tapi tracking number tak dikesan - JANGAN cuba fulfill semula, sila semak terus dalam dashboard EasyParcel dan masukkan tracking number manual. Respons: ${booking.rawDebug}`
        );
      } else {
        throw new Error(
          booking.errorMessage
            ? `EasyParcel gagal: ${booking.errorMessage} | Respons: ${booking.rawDebug}`
            : `EasyParcel tidak pulangkan tracking number. Respons: ${booking.rawDebug}`
        );
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
