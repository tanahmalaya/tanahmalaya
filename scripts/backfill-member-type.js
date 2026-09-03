// One-off: isi field "type" untuk ahli sedia ada berdasarkan siri no ahli -
// siri "TM-" = Ahli PLT (ahli penuh), siri "PLT-" (atau lain-lain) = Ahli Bersekutu/Fans.
//
// Guna: node scripts/backfill-member-type.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({ select: { id: true, memberNo: true, type: true } });
  console.log(`${members.length} ahli dijumpai.`);

  let pltCount = 0;
  let bersekutuCount = 0;

  for (const m of members) {
    const type = /^TM/i.test(m.memberNo) ? "PLT" : "BERSEKUTU";
    if (m.type !== type) {
      await prisma.member.update({ where: { id: m.id }, data: { type } });
    }
    if (type === "PLT") pltCount++;
    else bersekutuCount++;
  }

  console.log(`Selesai. Ahli PLT: ${pltCount}, Ahli Bersekutu: ${bersekutuCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
