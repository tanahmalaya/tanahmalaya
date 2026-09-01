export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import {
  submitEasyParcelOrder,
  checkEasyParcelRate,
  payEasyParcelOrder,
  checkEasyParcelOrderStatus,
  fetchEasyParcelAwbLink,
} from "@/lib/easyparcel";

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

    if (order.manualCourier) {
      results.push({
        id: orderId,
        success: false,
        error: "Order ni perlu staff pilih kurier & sahkan caj penghantaran secara manual dulu (tab \"Manual Courier\") sebelum boleh diproses.",
      });
      continue;
    }

    try {
      // Order ni DAH ADA order_number EasyParcel daripada percubaan
      // sebelum ni (submit berjaya tapi tracking belum siap masa tu) -
      // JANGAN submit order baru (risiko booking berganda + charge dua
      // kali). Terus cuba proses bayaran + tarik tracking untuk order
      // sedia ada tu.
      if (order.easyparcelOrderNo && !order.trackingNumber) {
        const resolved = await resolveExistingEasyParcelOrder(order.easyparcelOrderNo);
        if (resolved.trackingNumber) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: resolved.trackingNumber,
              courierName: resolved.courierName ?? order.courierName,
              awbUrl: resolved.awbUrl,
              fulfillmentError: null,
            },
          });
          results.push({ id: orderId, success: true });
          continue;
        }
        // Order sedia ada masih belum ada tracking lepas cuba pay + check
        // status - simpan mesej terkini dan minta semakan manual (JANGAN
        // submit order baru untuk order_number yang sama).
        throw new Error(
          `Order EasyParcel (order_number: ${order.easyparcelOrderNo}) sedia ada tapi tracking number masih belum siap selepas cuba proses bayaran & semak status. JANGAN cuba fulfill semula (elak booking berganda) - sila semak terus dalam dashboard EasyParcel dan masukkan tracking number manual (guna scripts/set-tracking.js) jika order tu sebenarnya dah berjaya. Respons: ${resolved.rawDebug}`
        );
      }

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
            awbUrl: booking.awbUrl ?? (await backfillAwbUrl(booking.trackingNumber)),
            serviceId,
            fulfillmentError: null,
          },
        });
        results.push({ id: orderId, success: true });
      } else if (booking.success && !booking.trackingNumber) {
        // EasyParcel kata order "berjaya" DICIPTA (order_number wujud) tapi
        // tracking number belum ada dalam respons submit - ni NORMAL, sebab
        // AWB EasyParcel cuma di-generate lepas order dibayar (EPPayOrderBulk).
        // Simpan order_number dulu (supaya percubaan akan datang tak submit
        // order BARU untuk order yang sama), lepas tu terus cuba bayar +
        // tarik tracking dalam permintaan yang sama.
        if (booking.orderNo) {
          await prisma.order.update({
            where: { id: order.id },
            data: { easyparcelOrderNo: booking.orderNo, serviceId },
          });
        }

        const resolved = booking.orderNo
          ? await resolveExistingEasyParcelOrder(booking.orderNo)
          : { trackingNumber: null, courierName: null, rawDebug: booking.rawDebug };

        if (resolved.trackingNumber) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: resolved.trackingNumber,
              courierName: resolved.courierName ?? courierNameGuna,
              awbUrl: resolved.awbUrl,
              fulfillmentError: null,
            },
          });
          results.push({ id: orderId, success: true });
          continue;
        }

        throw new Error(
          `EasyParcel kata BERJAYA (order_number: ${booking.orderNo ?? "?"}) tapi tracking number tak dikesan walaupun dah cuba proses bayaran automatik - JANGAN cuba fulfill semula (order_number dah disimpan, percubaan seterusnya akan cuba bayar/semak status sahaja, bukan cipta order baru). Sila semak terus dalam dashboard EasyParcel dan masukkan tracking number manual jika perlu. Respons submit: ${booking.rawDebug} | Respons susulan: ${resolved.rawDebug}`
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

/**
 * Untuk order_number EasyParcel yang DAH WUJUD (submit dah berjaya
 * sebelum ni) tapi belum ada tracking number lagi: cuba proses bayaran
 * dulu (EPPayOrderBulk - ni langkah yang biasanya generate AWB), dan
 * kalau tracking masih tak masuk serta-merta, cuba semak status order
 * (EPOrderStatusBulk) sekali sebagai fallback.
 *
 * TIDAK PERNAH panggil submitEasyParcelOrder di sini - fungsi ni hanya
 * proses/susuli order yang sedia ada, jadi selamat dari risiko booking
 * berganda walaupun dipanggil berulang kali untuk order_number yang sama.
 */
async function resolveExistingEasyParcelOrder(orderNo: string) {
  const payResult = await payEasyParcelOrder(orderNo);
  if (payResult.trackingNumber) {
    return {
      trackingNumber: payResult.trackingNumber,
      courierName: payResult.courierName,
      awbUrl: payResult.awbUrl ?? (await backfillAwbUrl(payResult.trackingNumber)),
      rawDebug: payResult.rawDebug,
    };
  }

  // Pay tak terus bagi tracking (contoh: order tu rupanya dah dibayar
  // sebelum ni, atau AWB ambil masa sedikit untuk siap) - cuba semak
  // status sekali sebagai percubaan terakhir sebelum minta semakan manual.
  const statusResult = await checkEasyParcelOrderStatus(orderNo);
  return {
    trackingNumber: statusResult.trackingNumber,
    courierName: statusResult.courierName,
    awbUrl: statusResult.awbUrl ?? (statusResult.trackingNumber ? await backfillAwbUrl(statusResult.trackingNumber) : null),
    rawDebug: `${payResult.rawDebug} | status-check: ${statusResult.rawDebug}`,
  };
}

/**
 * EPOrderStatusBulk/EPPayOrderBulk pada akaun ni tak pulangkan pautan PDF AWB
 * terus - kena tarik guna EPParcelStatusBulk (bulk[0][awb_no]) sebaliknya.
 */
async function backfillAwbUrl(awbNo: string): Promise<string | null> {
  const lookup = await fetchEasyParcelAwbLink(awbNo);
  return lookup.awbUrl;
}
