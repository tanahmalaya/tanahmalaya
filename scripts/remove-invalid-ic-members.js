// Buang ahli sedia ada yang guna No. Kad Pengenalan tak sah (palsu/data uji) -
// senarai memberNo diberi terus sebagai argumen supaya senang disemak sebelum jalan.
// Rekod yang dipadam disimpan dulu sebagai backup JSON sebelum dibuang.
//
// Guna: node scripts/remove-invalid-ic-members.js <backupFilePath> <memberNo1> <memberNo2> ...

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const [backupPath, ...memberNos] = process.argv.slice(2);
  if (!backupPath || memberNos.length === 0) {
    console.error("Guna: node scripts/remove-invalid-ic-members.js <backupFilePath> <memberNo1> <memberNo2> ...");
    process.exit(1);
  }

  const members = await prisma.member.findMany({ where: { memberNo: { in: memberNos } } });
  if (members.length !== memberNos.length) {
    const found = new Set(members.map((m) => m.memberNo));
    const missing = memberNos.filter((n) => !found.has(n));
    console.error(`Tak jumpa memberNo: ${missing.join(", ")} - berhenti, tiada apa dipadam.`);
    process.exit(1);
  }

  fs.writeFileSync(backupPath, JSON.stringify(members, null, 2));
  console.log(`Backup ${members.length} rekod disimpan di: ${backupPath}`);

  const result = await prisma.member.deleteMany({ where: { memberNo: { in: memberNos } } });
  console.log(`Dipadam: ${result.count} ahli.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
