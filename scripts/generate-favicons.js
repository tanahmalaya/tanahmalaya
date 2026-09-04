// Generate properly-sized favicon/icon assets from public/logo.png
// Run: node scripts/generate-favicons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "logo.png");

async function pngBuffer(size) {
  return sharp(SOURCE, { limitInputPixels: false })
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();
}

// Minimal ICO container that embeds raw PNG data per entry (supported
// since Windows Vista and by every modern browser).
function buildIco(entries) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = entries.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(numImages, 4);

  let offset = headerSize + dirEntrySize * numImages;
  const dirEntries = [];
  const imageBuffers = [];

  for (const { size, buffer } of entries) {
    const dirEntry = Buffer.alloc(dirEntrySize);
    dirEntry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    dirEntry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    dirEntry.writeUInt8(0, 2); // color palette
    dirEntry.writeUInt8(0, 3); // reserved
    dirEntry.writeUInt16LE(1, 4); // color planes
    dirEntry.writeUInt16LE(32, 6); // bits per pixel
    dirEntry.writeUInt32LE(buffer.length, 8); // image data size
    dirEntry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(dirEntry);
    imageBuffers.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source logo not found: ${SOURCE}`);
  }

  const iconsDir = path.join(ROOT, "public", "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  // favicon.ico (16/32/48)
  const icoSizes = [16, 32, 48];
  const icoEntries = [];
  for (const size of icoSizes) {
    icoEntries.push({ size, buffer: await pngBuffer(size) });
  }
  fs.writeFileSync(path.join(ROOT, "app", "favicon.ico"), buildIco(icoEntries));
  console.log("Wrote app/favicon.ico");

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
