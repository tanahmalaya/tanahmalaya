// Tukar senarai stesen aras air JPS (CSV, koordinat DMS) daripada data.gov.my
// kepada JSON (lat/lng decimal) untuk digunakan oleh app/api/paras-air/route.ts.
//
// Sumber: https://archive.data.gov.my/data/ms_MY/dataset/stesen-aras-air-di-rangkaian-hidrologi-nasional
// Jalankan semula bila perlu kemas kini: node scripts/generate-stesen-aras-air.mjs

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "data-source", "stesen-aras-air.csv");
const outPath = join(__dirname, "..", "lib", "data", "stesen-aras-air.json");

function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function dmsToDecimal(dms) {
  // parseFloat (bukan Number) sebab sesetengah baris sumber ada typo cth "14.4."
  const parts = dms.trim().split(/\s+/).map((p) => parseFloat(p));
  const [deg, min = 0, sec = 0] = parts;
  if (Number.isNaN(deg)) return null;
  return deg + (Number.isNaN(min) ? 0 : min) / 60 + (Number.isNaN(sec) ? 0 : sec) / 3600;
}

const raw = readFileSync(csvPath, "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

const stations = {};
for (const line of lines.slice(3)) {
  const [stationNo, name, fn, state, lat, lng] = parseCsvLine(line);
  if (!stationNo || stationNo.startsWith("Note")) continue;
  if (!name || !state || !lat || !lng) continue;

  const latitude = dmsToDecimal(lat);
  const longitude = dmsToDecimal(lng);
  if (latitude === null || longitude === null) continue;

  stations[stationNo.trim()] = {
    name: name.trim(),
    state: state.trim(),
    lat: Number(latitude.toFixed(6)),
    lng: Number(longitude.toFixed(6)),
  };
}

writeFileSync(outPath, JSON.stringify(stations, null, 2));
console.log(`Ditulis ${Object.keys(stations).length} stesen ke ${outPath}`);
