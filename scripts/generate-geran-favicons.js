// Generate GERAN-specific icon assets from public/geran-logo-g.jpeg.
// icon.png/apple-icon.png diletak bawah app/geran/ supaya Next memancarkan
// <link rel="icon"> berasingan untuk setiap halaman /geran/** (dan
// gerantanah.com, yang di-rewrite ke /geran oleh middleware.ts).
// public/geran-favicon.ico pula dihidangkan di /favicon.ico untuk hos
// GERAN melalui rewrite dalam middleware.ts.
// Run: node scripts/generate-geran-favicons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { buildIco } = require("./build-ico");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "geran-logo-g.jpeg");
const GERAN_DIR = path.join(ROOT, "app", "geran");

async function pngBuffer(size) {
  return sharp(SOURCE, { limitInputPixels: false })
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source logo not found: ${SOURCE}`);
  }

  fs.writeFileSync(path.join(GERAN_DIR, "icon.png"), await pngBuffer(512));
  console.log("Wrote app/geran/icon.png (512x512)");

  fs.writeFileSync(path.join(GERAN_DIR, "apple-icon.png"), await pngBuffer(180));
  console.log("Wrote app/geran/apple-icon.png (180x180)");

  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, buffer: await pngBuffer(size) });
  }
  fs.writeFileSync(path.join(ROOT, "public", "geran-favicon.ico"), buildIco(icoEntries));
  console.log("Wrote public/geran-favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
