export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { SIZE_LABEL } from "@/lib/productSize";

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

    // order.items boleh ada BEBERAPA baris untuk produk+saiz yang SAMA sebab
    // diskaun 10% unit kedua dipecahkan jadi baris berasingan (harga asal vs
    // harga diskaun) - kena cantumkan balik ikut produk+saiz supaya senarai
    // barang pada CSV/label tak sebut barang yang sama dua kali. Harga per
    // item dikira purata (jumlah nilai / jumlah kuantiti) supaya jumlah nilai
    // barang untuk kastam/insurans kekal tepat.
    const barangMap = new Map<
      string,
      { nama: string; kodRingkas: string | null; saiz: string | null; kuantiti: number; jumlahSen: number }
    >();
    for (const item of order.items) {
      const kunci = `${item.productId}|${item.saiz ?? ""}`;
      const sedia = barangMap.get(kunci);
      if (sedia) {
        sedia.kuantiti += item.kuantiti;
        sedia.jumlahSen += item.hargaSen * item.kuantiti;
      } else {
        barangMap.set(kunci, {
          nama: item.product.nama,
          kodRingkas: item.product.kodRingkas,
          saiz: item.saiz,
          kuantiti: item.kuantiti,
          jumlahSen: item.hargaSen * item.kuantiti,
        });
      }
    }
    const barang = Array.from(barangMap.values());
    // Guna kodRingkas (bukan nama penuh) supaya senarai barang tak
    // bertindih/overflow pada label bila order ada banyak barang sekali.
    const namaBarang = barang
      .map((b) => `${b.kodRingkas?.trim() || b.nama}${b.saiz ? `-${SIZE_LABEL[b.saiz as keyof typeof SIZE_LABEL]}` : ""}`)
      .join("; ");
    const hargaBarang = barang.map((b) => (b.jumlahSen / b.kuantiti / 100).toFixed(2)).join("; ");
    const kuantiti = barang.map((b) => b.kuantiti).join("; ");

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
