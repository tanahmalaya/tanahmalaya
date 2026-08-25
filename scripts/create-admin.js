// Cipta akaun admin/staff untuk dashboard.
// Guna (ADMIN, akses penuh): node scripts/create-admin.js "emel@tanahmalaya.org" "kata-laluan"
// Guna (STAFF, Pesanan sahaja): node scripts/create-admin.js "emel-staff@tanahmalaya.org" "kata-laluan" STAFF

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, roleArg] = process.argv;
  if (!email || !password) {
    console.error('Guna: node scripts/create-admin.js "emel@contoh.com" "kata-laluan" [STAFF]');
    process.exit(1);
  }

  const role = roleArg === "STAFF" ? "STAFF" : "ADMIN";
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, name: role === "STAFF" ? "Staff PLT" : "Admin PLT", role },
  });

  console.log(`Akaun ${role} sedia: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());