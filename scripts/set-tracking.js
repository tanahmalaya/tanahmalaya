// Masukkan tracking number MANUAL untuk satu order (tanpa panggil API
// EasyParcel langsung) - guna bila order tu dah confirm berjaya di-book
// terus dalam dashboard EasyParcel, tapi sistem kita tersilap anggap gagal.
//
// Guna: node scripts/set-tracking.js <seq> "<trackingNumber>" "<namaKurier>" ["<easyparcelOrderNo>"]
// Contoh: node scripts/set-tracking.js 14 "238012345678" "SPX Xpress" "EI123456789"

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [, , seqArg, trackingNumber, courierName, easyparcelOrderNo] = process.argv;
  const seq = parseInt(seqArg, 10);

  if (!seq || !trackingNumber || !courierName) {
    console.error(
      'Guna: node scripts/set-tracking.js <seq> "<trackingNumber>" "<namaKurier>" ["<easyparcelOrderNo>"]'
    );
    process.exit(1);
  }

  const order = await prisma.order.findFirst({ where: { seq } });
  if (!order) {
    console.error(`Order #${seq} tak jumpa.`);
    process.exit(1);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingNumber,
      courierName,
      easyparcelOrderNo: easyparcelOrderNo || order.easyparcelOrderNo,
      fulfillmentError: null,
    },
  });

  console.log(`Order #${seq} (${order.namaPembeli}) dah ditanda fulfill - tracking: ${trackingNumber} (${courierName})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
