// Jalankan SEKALI SAHAJA lepas `npm run db:push` (yang tambah status
// SELESAI/DIPULANGKAN + kolum refund kat DB). Order LAMA yang dah bayar
// (BERJAYA) dan dah dicetak (printedAt terisi) akan ditukar status kepada
// SELESAI, supaya ia terus muncul dalam seksyen "Selesai" dashboard baru
// (yang sekarang guna status, bukan lagi anggaran daripada printedAt).
//
// Guna: node scripts/backfill-selesai-status.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: "BERJAYA", printedAt: { not: null } },
    data: { status: "SELESAI" },
  });
  console.log(`${result.count} order lama ditukar status kepada SELESAI.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
