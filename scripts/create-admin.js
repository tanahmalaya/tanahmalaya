// Cipta akaun admin pertama untuk dashboard.
// Guna: node scripts/create-admin.js "emel@tanahmalaya.org" "kata-laluan-kuat"

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Guna: node scripts/create-admin.js "emel@contoh.com" "kata-laluan"');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin PLT" },
  });

  console.log(`Akaun admin sedia: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
