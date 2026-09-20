// Cipta akaun admin untuk dashboard gerantanah.com (berasingan dari admin PLT).
// Guna: node scripts/create-geran-admin.js "emel@gerantanah.com" "kata-laluan"

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Guna: node scripts/create-geran-admin.js "emel@contoh.com" "kata-laluan"');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.geranAdminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin GERAN" },
  });

  console.log(`Akaun GERAN admin sedia: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
