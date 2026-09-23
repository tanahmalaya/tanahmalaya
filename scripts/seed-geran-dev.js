// Isi database DEV dengan penyenaraian GERAN rekaan untuk menguji LANDHUB.
// Guna: node --env-file=.env.local scripts/seed-geran-dev.js
//
// Enggan jalan kalau DATABASE_URL tunjuk ke projek Supabase production -
// Prisma CLI & skrip Node baca .env (production) secara lalai, jadi satu
// terlupa --env-file sudah cukup untuk tulis data palsu ke laman sebenar.

const { PrismaClient } = require("@prisma/client");

const PROJEK_PRODUCTION = "txuiipbqqaqfjujeyewk";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes(PROJEK_PRODUCTION)) {
  console.error("DATABASE_URL tunjuk ke production (atau kosong). Jalankan dengan --env-file=.env.local.");
  process.exit(1);
}

const prisma = new PrismaClient();
const GAMBAR = "https://gerantanah.com/hero-geran.jpg";

const SAMPEL = [
  ["Tanah Pertanian 5.2 Ekar, Kluang", "Johor", "Kluang", "1234", "PERTANIAN", "FREEHOLD", 5.2, 85_000_000, "DISAHKAN"],
  ["Tanah Kebun 3.1 Ekar, Mersing", "Johor", "Mersing", "5678", "PERTANIAN", "FREEHOLD", 3.1, 62_000_000, "MENUNGGU_SEMAKAN"],
  ["Tanah Getah 8.4 Ekar, Segamat", "Johor", "Segamat", "9012", "PERTANIAN", "LEASEHOLD", 8.4, 120_000_000, "DALAM_RUNDINGAN"],
  ["Lot Kediaman 0.5 Ekar, Jasin", "Melaka", "Jasin", "3301", "PERUMAHAN", "FREEHOLD", 0.5, 28_000_000, "DISAHKAN"],
  ["Tanah Pembangunan 12 Ekar, Kuala Selangor", "Selangor", "Kuala Selangor", "7788", "PEMBANGUNAN", "FREEHOLD", 12, 480_000_000, "DISAHKAN"],
  ["Tanah Kosong 2 Ekar, Bentong", "Pahang", "Bentong", "4410", "KOSONG", "TIDAK_PASTI", 2, 35_000_000, "DITOLAK"],
];

async function main() {
  const sedia = await prisma.geran.count();
  if (sedia > 0) {
    console.log(`Database dev dah ada ${sedia} penyenaraian - tiada apa ditambah.`);
    return;
  }

  for (const [tajuk, negeri, daerahMukim, nomborLot, jenisTanah, jenisHakmilik, keluasan, hargaSen, status] of SAMPEL) {
    await prisma.geran.create({
      data: {
        sumber: "PLT",
        namaPenjual: "Pejabat GT",
        telefonPenjual: "0123456789",
        emelPenjual: "dev@gerantanah.com",
        tajuk,
        negeri,
        daerahMukim,
        nomborLot,
        jenisTanah,
        jenisHakmilik,
        keluasan,
        unitKeluasan: "EKAR",
        hargaAmbilSen: BigInt(Math.round(hargaSen * 0.85)),
        hargaSiaranSen: BigInt(hargaSen),
        keterangan: "Penyenaraian rekaan untuk ujian LANDHUB.",
        gambarUrls: [GAMBAR],
        status,
      },
    });
  }
  console.log(`${SAMPEL.length} penyenaraian rekaan ditambah ke database dev.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
