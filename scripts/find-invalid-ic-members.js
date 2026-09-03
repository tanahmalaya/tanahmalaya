// Cari ahli sedia ada yang guna No. Kad Pengenalan tak sah (format/tarikh lahir
// tak masuk akal) - biasanya IC palsu/data uji semasa import lama.
// Logik sama macam lib/ic.ts (isValidMalaysianIC), ditulis semula di sini
// sebab script ni js biasa (bukan ts-node).
//
// Guna: node scripts/find-invalid-ic-members.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function isValidMalaysianIC(icNumberRaw) {
  const icNumber = (icNumberRaw || "").replace(/\D/g, "");

  if (!/^\d{12}$/.test(icNumber)) {
    return { valid: false, reason: "Bukan 12 digit" };
  }

  const yy = parseInt(icNumber.slice(0, 2), 10);
  const mm = parseInt(icNumber.slice(2, 4), 10);
  const dd = parseInt(icNumber.slice(4, 6), 10);
  const placeCode = parseInt(icNumber.slice(6, 8), 10);

  if (mm < 1 || mm > 12) {
    return { valid: false, reason: `Bulan tak sah (${mm})` };
  }

  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  const birthYear = century + yy;

  const daysInMonth = new Date(birthYear, mm, 0).getDate();
  if (dd < 1 || dd > daysInMonth) {
    return { valid: false, reason: `Hari tak sah (${dd}/${mm})` };
  }

  if (placeCode < 1) {
    return { valid: false, reason: "Kod tempat lahir tak sah (00)" };
  }

  return { valid: true };
}

async function main() {
  const members = await prisma.member.findMany({
    select: { id: true, memberNo: true, fullName: true, icNumber: true, type: true, status: true },
  });

  const invalid = members
    .map((m) => ({ ...m, check: isValidMalaysianIC(m.icNumber) }))
    .filter((m) => !m.check.valid);

  console.log(`${members.length} ahli disemak, ${invalid.length} dengan IC tak sah:\n`);
  for (const m of invalid) {
    console.log(`${m.memberNo}\t${m.fullName}\t${m.icNumber}\t${m.type}\t${m.status}\t- ${m.check.reason}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
