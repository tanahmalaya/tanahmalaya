// Generate GERAN-specific icon assets from public/geran-logo-g.jpeg.
// Placed under app/geran/ so Next.js emits a separate <link rel="icon">
// for every /geran/** page (and gerantanah.com, which is rewritten to
// /geran by middleware.ts) instead of falling back to the PLT favicon
// declared at app/icon.png.
// Run: node scripts/generate-geran-favicons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
