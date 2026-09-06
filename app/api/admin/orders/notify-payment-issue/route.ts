export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emailHtml(namaPembeli: string, itemsDesc: string, jumlahSen: number) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2A1D14;">
    <p>Salam sejahtera ${namaPembeli},</p>
    <p>Kami perasan pembelian anda di Pertubuhan Literasi Tanah untuk <strong>${itemsDesc}</strong> (${formatRM(jumlahSen)}) belum selesai bayarannya.</p>
    <p><strong>Ada masalah dengan pembelian atau pembayaran anda?</strong></p>
    <p>Jika anda menghadapi sebarang masalah semasa membuat pembayaran (cth. gangguan bank, pautan tamat tempoh, dsb.), sila maklumkan kepada kami dengan reply email ini, atau hubungi kami di <a href="mailto:info@tanahmalaya.org">info@tanahmalaya.org</a>, dan kami akan bantu selesaikan.</p>
    <p>Jika anda masih berminat membeli, sila lawati semula laman web kami untuk membuat pembelian baharu.</p>
    <p>Terima kasih.<br/>Pertubuhan Literasi Tanah</p>
  </div>`;
}

// Hantar email kepada pembeli yang order MENUNGGU/GAGAL (bayaran tak
// selesai) - tanya sama ada ada masalah, supaya staff tak perlu telefon
// satu-satu. Dihantar secara manual oleh admin (bukan automatik) supaya
// admin boleh semak dulu order mana yang memang patut dihubungi.
export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = body.orderIds || [];
  if (orderIds.length === 0) {
    return NextResponse.json({ error: "Tiada order dipilih" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { items: { include: { product: true } } },
  });

  const results: { orderId: string; seq: number; emel: string; sent: boolean; message: string }[] = [];

  for (const order of orders) {
    if (order.status !== "MENUNGGU" && order.status !== "GAGAL") {
      results.push({ orderId: order.id, seq: order.seq, emel: order.emel, sent: false, message: "Dilangkau - bukan status MENUNGGU/GAGAL" });
      continue;
    }

    const itemsDesc = order.items.map((it) => `${it.product.nama} x${it.kuantiti}`).join(", ");

    try {
      await sendEmail({
        to: order.emel,
        subject: "Ada masalah dengan pembelian atau pembayaran anda? - Pertubuhan Literasi Tanah",
        html: emailHtml(order.namaPembeli, itemsDesc, order.jumlahSen),
      });
      results.push({ orderId: order.id, seq: order.seq, emel: order.emel, sent: true, message: "Email dihantar" });
    } catch (e) {
      results.push({
        orderId: order.id,
        seq: order.seq,
        emel: order.emel,
        sent: false,
        message: `Gagal hantar: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return NextResponse.json({ results });
}
