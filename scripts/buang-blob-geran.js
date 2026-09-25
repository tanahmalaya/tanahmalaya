// Fasa 4c pemisahan GERAN: padam fail bawah geran/ dalam stor Blob utama PLT.
// GERAN kini ada stor Blob sendiri; fail di sini sisa sebelum pemisahan dan
// dah dibackup ke C:\Users\talha\projects\backups\blob-geran-tanahmalaya.
//
// Guna:
//   node --env-file=.env scripts/buang-blob-geran.js           (senarai sahaja)
//   node --env-file=.env scripts/buang-blob-geran.js --padam   (padam betul-betul)

const { list, del } = require("@vercel/blob");

const PADAM = process.argv.includes("--padam");

async function main() {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: "geran/", cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.cursor;
  } while (cursor);

  for (const b of blobs) console.log(`${(b.size / 1024).toFixed(0).padStart(6)} KB  ${b.pathname}`);
  console.log(`\n${blobs.length} fail bawah geran/.`);

  if (!PADAM) {
    console.log("Mod senarai - tiada apa dipadam. Tambah --padam untuk padam.");
    return;
  }
  if (blobs.length) await del(blobs.map((b) => b.url));
  console.log(`${blobs.length} fail dipadam.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
