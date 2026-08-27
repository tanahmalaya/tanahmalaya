import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

// Fail CSV perlu ada header (baris pertama) dengan nama lajur ni (huruf besar/kecil
// dan tanda baca tak kira - sistem buang semua tanda baca sebelum banding):
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

  // Normalize: buang SEMUA tanda baca/ruang (bukan cuma ruang kosong), huruf kecil.
  // Kemudian padan jika header MENGANDUNGI (bukan sama PERSIS) kata kunci calon -
  // ini elak masalah header macam "No Kad Pengenalan (TANPA TANDA -)" tak padan
  // dengan "nokadpengenalan" sebab ada teks/tanda tambahan.
  function normalize(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  const findKey = (row: Record<string, string>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      const normalizedCandidate = normalize(candidate);
      const found = keys.find((k) => normalize(k).includes(normalizedCandidate));
      if (found && row[found]) return row[found];
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
    const fullName = findKey(row, ["fullname", "namapenuh", "nama"]);
    const icNumber = findKey(row, ["icnumber", "nokadpengenalan", "nokp", "ic"]);
    const phone = findKey(row, ["phone", "notelefon", "telefon"]);
    const email = findKey(row, ["email", "emel"]);
    let memberNo = findKey(row, ["memberno", "noahli"]);

    // Bersihkan No KP - buang apa-apa selain nombor (kadang ada tanda '-' terselit)
    const icCleaned = icNumber.replace(/\D/g, "");

    if (!fullName || !icCleaned) {
      skipped++;
      errors.push(`Baris dilangkau (tiada nama/IC): ${fullName || "?"} / ${icNumber || "?"}`);
      continue;
    }

    if (!memberNo) {
      highest += 1;
      memberNo = `PLT-${String(highest).padStart(3, "0")}`;
    }

    try {
      await prisma.member.upsert({
        where: { icNumber: icCleaned },
        update: { fullName, phone, email, memberNo },
        create: {
          memberNo,
          fullName,
          icNumber: icCleaned,
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