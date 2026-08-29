// Tambah 4 aktiviti CONTOH (data ujian) supaya tuan boleh nampak kesan
// side-scroll pada bahagian "AKTIVITI TERKINI" - sebab dengan cuma 2
// aktiviti sebenar sekarang, tiada apa nak di-scroll pun.
//
// Gambar guna placeholder awam (picsum.photos) - selamat dipadam/tukar
// bila-bila masa. Tajuk sengaja diawali "[CONTOH]" supaya senang dikenal
// pasti dan dibuang lepas siap test.
//
// Guna: node scripts/seed-sample-activities.js
//
// Untuk BUANG balik lepas siap test, paling senang guna Prisma Studio:
//   npm run db:studio
// -> buka jadual Activity -> padam baris yang tajuknya bermula "[CONTOH]".

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CONTOH = [
  {
    tarikh: new Date("2026-08-20"),
    tajuk: "[CONTOH] Gotong-Royong Membersih Sungai",
    keterangan: "Aktiviti gotong-royong membersihkan kawasan sungai bersama komuniti setempat.",
    gambar1: "https://picsum.photos/seed/plt-sungai-1/600/600",
    gambar2: "https://picsum.photos/seed/plt-sungai-2/600/600",
  },
  {
    tarikh: new Date("2026-08-10"),
    tajuk: "[CONTOH] Bengkel Kompos Organik",
    keterangan: "Bengkel praktikal mengajar peserta membuat kompos organik daripada sisa dapur.",
    gambar1: "https://picsum.photos/seed/plt-kompos-1/600/600",
    gambar2: "https://picsum.photos/seed/plt-kompos-2/600/600",
    gambar3: "https://picsum.photos/seed/plt-kompos-3/600/600",
  },
  {
    tarikh: new Date("2026-07-25"),
    tajuk: "[CONTOH] Lawatan Sambil Belajar Ladang Sayur",
    keterangan: "Lawatan bersama ahli ke ladang sayur organik untuk belajar teknik penanaman lestari.",
    gambar1: "https://picsum.photos/seed/plt-ladang-1/600/600",
    gambar2: "https://picsum.photos/seed/plt-ladang-2/600/600",
    gambar3: "https://picsum.photos/seed/plt-ladang-3/600/600",
    gambar4: "https://picsum.photos/seed/plt-ladang-4/600/600",
  },
  {
    tarikh: new Date("2026-07-05"),
    tajuk: "[CONTOH] Ceramah Kesedaran Alam Sekitar",
    keterangan: "Sesi ceramah dan sembang santai berkaitan kesedaran alam sekitar untuk komuniti setempat.",
    gambar1: "https://picsum.photos/seed/plt-ceramah-1/600/600",
  },
];

async function main() {
  for (const a of CONTOH) {
    const created = await prisma.activity.create({ data: a });
    console.log(`Ditambah: ${created.tajuk} (${created.tarikh.toLocaleDateString("ms-MY")})`);
  }
  console.log(`\n${CONTOH.length} aktiviti contoh ditambah. Lepas siap test, padam terus guna Prisma Studio (npm run db:studio).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
