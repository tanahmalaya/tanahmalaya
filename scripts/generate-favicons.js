// Generate properly-sized favicon/icon assets from public/logo.png
// Run: node scripts/generate-favicons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { buildIco } = require("./build-ico");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "logo.png");

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

  const iconsDir = path.join(ROOT, "public", "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  // favicon.ico (16/32/48). Sengaja diletak di public/ dan BUKAN app/:
  // app/favicon.ico akan buat Next memancarkan <link rel="icon"
  // href="/favicon.ico" sizes="16x16"> pada SETIAP halaman, termasuk
  // /geran. Pautan 16x16 itu padan tepat dengan saiz tab, jadi Chrome
  // pilih ia dan logo PLT muncul di tab gerantanah.com. Dari public/,
  // fail ini masih dihidangkan di /favicon.ico untuk pelayar/bot lama
  // tanpa merampas ikon laman GERAN.
  const icoSizes = [16, 32, 48];
  const icoEntries = [];
  for (const size of icoSizes) {
    icoEntries.push({ size, buffer: await pngBuffer(size) });
  }
  fs.writeFileSync(path.join(ROOT, "public", "favicon.ico"), buildIco(icoEntries));
  console.log("Wrote public/favicon.ico");

  // app/icon.png (used by Next's <link rel="icon">)
  fs.writeFileSync(path.join(ROOT, "app", "icon.png"), await pngBuffer(512));
  console.log("Wrote app/icon.png (512x512)");

  // app/apple-icon.png (iOS home screen / Safari)
  fs.writeFileSync(path.join(ROOT, "app", "apple-icon.png"), await pngBuffer(180));
  console.log("Wrote app/apple-icon.png (180x180)");

  // manifest icons (Android/Chrome, Google sitelinks favicon)
  for (const size of [192, 512]) {
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), await pngBuffer(size));
    console.log(`Wrote public/icons/icon-${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
