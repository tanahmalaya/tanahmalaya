// Salin akaun admin GERAN dari database production (.env) ke database dev
// (.env.local), supaya admin boleh log masuk ke dev server tempatan dengan
// emel & kata laluan yang sama. Production hanya DIBACA.
// Guna: node scripts/salin-admin-ke-dev.js

const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const PROJEK_PRODUCTION = "txuiipbqqaqfjujeyewk";

function bacaUrl(fail) {
  const m = fs.readFileSync(fail, "utf8").match(/^DATABASE_URL="?([^"\r\n]*)"?/m);
  return m ? m[1] : null;
}

const prodUrl = bacaUrl(".env");
const devUrl = bacaUrl(".env.local");

if (!prodUrl?.includes(PROJEK_PRODUCTION)) {
  console.error(".env bukan database production yang dijangka - batal.");
  process.exit(1);
}
if (!devUrl || devUrl.includes(PROJEK_PRODUCTION)) {
  console.error(".env.local kosong atau tunjuk ke production - batal.");
  process.exit(1);
}

async function main() {
  const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });
  const dev = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    const admins = await prod.geranAdminUser.findMany();
    for (const a of admins) {
      await dev.geranAdminUser.upsert({
        where: { email: a.email },
        update: { passwordHash: a.passwordHash, name: a.name },
        create: a,
      });
      console.log("Disalin:", a.email.replace(/^(.{2}).*(@.*)$/, "$1***$2"));
    }
    console.log(`Jumlah: ${admins.length} akaun admin disalin ke database dev.`);
  } finally {
    await prod.$disconnect();
    await dev.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
