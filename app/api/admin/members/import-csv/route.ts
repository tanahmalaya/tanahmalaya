export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

// Fail CSV perlu ada header (baris pertama) dengan nama lajur ni (huruf besar/kecil tak kira):
// memberNo,fullName,icNumber,phone,email
//
// Lajur memberNo BOLEH dibiarkan kosong - sistem akan jana automatik.
export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Tiada fail CSV dimuat naik" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);

  // Normalize header names (senang kalau Excel guna "Nama" instead of "fullName", dll)
  const findKey = (row: Record<string, string>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const found = keys.find((k) => k.toLowerCase().replace(/\s/g, "") === c.toLowerCase());
      if (found) return row[found];
    }
    return "";
  };

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Cari nombor ahli tertinggi sedia ada, untuk jana memberNo automatik jika kosong
  const existing = await prisma.member.findMany({ select: { memberNo: true } });
  let highest = existing
    .map((m) => parseInt(m.memberNo.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);

  for (const row of rows) {
    const fullName = findKey(row, ["fullname", "nama", "namapenuh"]);
    const icNumber = findKey(row, ["icnumber", "nokp", "nokadpengenalan", "ic"]);
    const phone = findKey(row, ["phone", "notelefon", "telefon"]);
    const email = findKey(row, ["email", "emel"]);
    let memberNo = findKey(row, ["memberno", "noahli"]);

    if (!fullName || !icNumber) {
      skipped++;
      errors.push(`Baris dilangkau (tiada nama/IC): ${JSON.stringify(row)}`);
      continue;
    }

    if (!memberNo) {
      highest += 1;
      memberNo = `PLT-${String(highest).padStart(3, "0")}`;
    }

    try {
      await prisma.member.upsert({
        where: { icNumber },
        update: { fullName, phone, email, memberNo },
        create: {
          memberNo,
          fullName,
          icNumber,
          phone: phone || "-",
          email: email || "-",
          status: "AKTIF",
          addedManually: true,
        },
      });
      imported++;
    } catch (e) {
      skipped++;
      errors.push(`Gagal import ${fullName}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) });
}
