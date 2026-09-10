export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

/**
 * Proxy untuk PDF AWB (dihoskan di server EasyParcel, cross-origin).
 *
 * Kenapa perlu proxy: butang "Print All" kat page packing-slip guna
 * iframe.contentWindow.print() untuk cetak setiap AWB secara automatik -
 * ni cuma boleh untuk iframe SAME-ORIGIN (sekatan browser). Tarik PDF
 * melalui route admin ni (same-origin) dan pulangkan sebagai blob supaya
 * boleh letak dalam iframe same-origin (blob: URL) untuk discript.
 *
 * URL AWB TIDAK diterima terus daripada client (elak SSRF) - kita cari
 * awbUrl yang tersimpan dalam DB untuk orderId yang diberi.
 */
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
    select: { awbUrl: true },
  });

  if (!order?.awbUrl) {
    return NextResponse.json({ error: "AWB tidak dijumpai untuk order ini" }, { status: 404 });
  }

  const upstream = await fetch(order.awbUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Gagal tarik AWB daripada EasyParcel" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      "Cache-Control": "private, max-age=60",
    },
  });
}
