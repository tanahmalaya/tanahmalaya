// Bina fail .ico minimal yang membungkus data PNG mentah bagi setiap saiz
// (disokong sejak Windows Vista dan oleh semua pelayar moden).
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

module.exports = { buildIco };
