export const dynamic = "force-dynamic";
export const maxDuration = 60; // bagi lebih masa untuk fail besar (jika pelan Vercel sokong)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findKey(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    const found = keys.find((k) => normalize(k).includes(normalizedCandidate));
    if (found && row[found]) return row[found];
  }
  return "";
}

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

  const existingMembers = await prisma.member.findMany({
    select: { id: true, icNumber: true, memberNo: true },
  });
  const existingByIc = new Map(existingMembers.map((m) => [m.icNumber, m]));
  let highestNo = existingMembers
    .map((m) => parseInt(m.memberNo.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);

  type Parsed = {
    icNumber: string;
    fullName: string;
    phone: string;
    email: string;
    memberNo: string;
  };

  const toCreate: Parsed[] = [];
  const toUpdate: (Parsed & { id: string })[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const seenInFile = new Set<string>();

  for (const row of rows) {
    const fullName = findKey(row, ["fullname", "namapenuh", "nama"]);
    const icRaw = findKey(row, ["icnumber", "nokadpengenalan", "nokp", "ic"]);
    const phone = findKey(row, ["phone", "notelefon", "telefon"]);
    const email = findKey(row, ["email", "emel"]);
    let memberNo = findKey(row, ["memberno", "noahli"]).trim();

    const icNumber = icRaw.replace(/\D/g, "");

    if (!fullName || !icNumber) {
      skipped++;
      errors.push(`Dilangkau (tiada nama/IC): ${fullName || "?"}`);
      continue;
    }

    if (seenInFile.has(icNumber)) {
      skipped++;
      errors.push(`IC bertindih DALAM fail, ambil kemasukan pertama sahaja: ${fullName} (${icNumber})`);
      continue;
    }
    seenInFile.add(icNumber);

    if (!memberNo) {
      highestNo += 1;
      memberNo = `PLT-${String(highestNo).padStart(3, "0")}`;
    } else {
      const n = parseInt(memberNo.replace(/\D/g, ""), 10);
      if (!isNaN(n) && n > highestNo) highestNo = n;
    }

    const existing = existingByIc.get(icNumber);
    if (existing) {
      toUpdate.push({ id: existing.id, icNumber, fullName, phone: phone || "-", email: email || "-", memberNo });
    } else {
      toCreate.push({ icNumber, fullName, phone: phone || "-", email: email || "-", memberNo });
    }
  }

  const existingMemberNos = new Set(existingMembers.map((m) => m.memberNo));
  const usedThisRun = new Set<string>();
  for (const item of toCreate) {
    if (existingMemberNos.has(item.memberNo) || usedThisRun.has(item.memberNo)) {
      highestNo += 1;
      item.memberNo = `PLT-${String(highestNo).padStart(3, "0")}`;
    }
    usedThisRun.add(item.memberNo);
  }

  let createdCount = 0;
  if (toCreate.length > 0) {
    const result = await prisma.member.createMany({
      // No ahli siri "TM-" = Ahli PLT (ahli penuh), selain itu (siri "PLT-") = Ahli Bersekutu
      data: toCreate.map((m) => ({
        memberNo: m.memberNo,
        fullName: m.fullName,
        icNumber: m.icNumber,
        phone: m.phone,
        email: m.email,
        type: /^TM/i.test(m.memberNo) ? "PLT" : "BERSEKUTU",
        status: "AKTIF",
        addedManually: true,
      })),
      skipDuplicates: true,
    });
    createdCount = result.count;
  }

  let updatedCount = 0;
  for (const item of toUpdate) {
    try {
      await prisma.member.update({
        where: { id: item.id },
        data: { fullName: item.fullName, phone: item.phone, email: item.email },
      });
      updatedCount++;
    } catch (e) {
      skipped++;
      errors.push(`Gagal kemaskini ${item.fullName}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({
    imported: createdCount + updatedCount,
    created: createdCount,
    updated: updatedCount,
    skipped,
    errors: errors.slice(0, 30),
  });
}