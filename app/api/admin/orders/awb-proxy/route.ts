export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

/**
 * Proxy + merge untuk PDF AWB (dihoskan di server EasyParcel, cross-origin).
 *
 * Kenapa perlu ni: butang "Bulk Print" kat page packing-slip nak cetak
 * SEMUA AWB yang dipilih dalam SATU job cetak (satu dialog print sahaja),
 * bukan buka dialog print berasingan untuk setiap AWB. Untuk itu semua PDF
 * kena digabung jadi SATU dokumen dulu (guna pdf-lib) sebelum print().
 *
 * Route ni jugak proxy same-origin untuk PDF tu (perlu untuk scripting
 * iframe.contentWindow.print() - browser sekat scripting iframe cross-origin).
 *
 * URL AWB TIDAK diterima terus daripada client (elak SSRF) - kita cari
 * awbUrl yang tersimpan dalam DB untuk orderId yang diberi.
 */
export async function GET(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const orderIdsParam = req.nextUrl.searchParams.get("orderIds") || req.nextUrl.searchParams.get("orderId");
  const orderIds = orderIdsParam?.split(",").filter(Boolean) || [];
  if (orderIds.length === 0) {
    return NextResponse.json({ error: "orderIds diperlukan" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, awbUrl: true },
  });
  const awbById = new Map(orders.map((o) => [o.id, o.awbUrl]));

  // Kekalkan urutan ikut orderIds yang diminta (bukan urutan hasil query DB).
  const awbUrls = orderIds.map((id) => awbById.get(id)).filter((url): url is string => !!url);

  if (awbUrls.length === 0) {
    return NextResponse.json({ error: "AWB tidak dijumpai untuk order ini" }, { status: 404 });
  }

  try {
    const merged = await PDFDocument.create();
    for (const url of awbUrls) {
      const upstream = await fetch(url);
      if (!upstream.ok) continue;
      const bytes = await upstream.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const copiedPages = await merged.copyPages(src, src.getPageIndices());
      copiedPages.forEach((page) => merged.addPage(page));
    }

    if (merged.getPageCount() === 0) {
      return NextResponse.json({ error: "Gagal tarik mana-mana AWB daripada EasyParcel" }, { status: 502 });
    }

    const mergedBytes = await merged.save();
    return new NextResponse(Buffer.from(mergedBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: `Gagal gabungkan AWB: ${(e as Error).message}` }, { status: 502 });
  }
}
