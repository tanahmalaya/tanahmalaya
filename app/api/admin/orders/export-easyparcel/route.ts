export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const MAX_BULK = 30;

// Lajur ni ikut turutan EXACT dalam template rasmi EasyParcel
// "Bulk Single Pick Up Template" (sheet "order"). Kalau EasyParcel
// kemas kini template diorang, kena selaraskan turutan ni balik.
const HEADERS = [
  "No.",
  "Receiver Name *",
  "Receiver Phone Number Country *",
  "Receiver Phone Number *",
  "Receiver Alt Phone Number Country",
  "Receiver Alt Phone Number",
  "Receiver Company",
  "Receiver Email",
  "Receiver Address *",
  "Receiver Postcode *",
  "Receiver City *",
  "Receiver State *",
  "Receiver Country *",
  "Receiver address is residential address? (Yes/No)",
  "Receiver Tax ID",
  "Parcel Weight (kg) *",
  "Length (cm) *",
  "Width (cm) *",
  "Height (cm) *",
  "Parcel Currency *",
  "Item Name *",
  "Price Per Item *",
  "Quantity *",
  "HS Code",
  "Reference / Remark",
  "COD Currency",
  "COD Amount",
  "Receiver Consignee Type(B2B/B2C)",
  "Receiver EORI / VAT Number",
  "Item Country of Origin",
  "Item Merchant SKU",
  "Item Manufacturer Product ID",
  "Item Standardised Product ID",
];

// Bersihkan nombor telefon: buang semua selain digit, buang "60" atau "0"
// kat depan (sebab kod negara dah letak dalam lajur berasingan).
function cleanPhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("60")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = (body.orderIds || []).slice(0, MAX_BULK);

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { items: { include: { product: true } } },
    orderBy: { seq: "asc" },
  });

  const rows = orders.map((order, idx) => {
    const totalBeratKg =
      order.items.reduce((sum, item) => sum + (item.product.beratGram ?? 500) * item.kuantiti, 0) / 1000;
    const namaBarang = order.items.map((i) => i.product.nama).join("; ");
    const hargaBarang = order.items.map((i) => (i.hargaSen / 100).toFixed(2)).join("; ");
    const kuantiti = order.items.map((i) => i.kuantiti).join("; ");

    return [
      idx + 1,
      order.namaPembeli,
      "Malaysia +60",
      cleanPhone(order.telefon),
      "",
      "",
      "",
      order.emel,
      order.alamat,
      order.poskod,
      order.bandar,
      order.negeri,
      "Malaysia",
      "Yes",
      "",
      totalBeratKg > 0 ? totalBeratKg.toFixed(2) : "1",
      // Tiada data dimensi produk disimpan dalam sistem - guna anggaran
      // umum. TUAN KENA SEMAK/UBAH nombor ni ikut saiz bungkusan sebenar
      // sebelum upload, terutama untuk barang besar.
      "20",
      "15",
      "10",
      "MYR",
      namaBarang,
      hargaBarang,
      kuantiti,
      "",
      `PLT-${order.seq}`,
      "",
      "",
      "B2C",
      "",
      "",
      "",
      "",
      "",
    ];
  });

  const lines = [HEADERS, ...rows].map((row) => row.map(csvEscape).join(","));
  const csv = "﻿" + lines.join("\r\n"); // BOM supaya Excel baca UTF-8 betul (nama ada aksara Melayu)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="easyparcel-manual-${Date.now()}.csv"`,
    },
  });
}
