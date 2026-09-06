// Import "Jadual Data Transaksi Harta Tanah" NAPIC (fail .xlsx rasmi, satu fail
// per negeri per suku tahun) ke jadual NapicRujukanHarga.
//
// Fail asal: napic.jpph.gov.my/ms/penerbitan > Pasaran Harta Tanah >
// Jadual Data Transaksi Harta Tanah. Kita hanya guna 3 sheet yang relevan untuk
// tanah: "4.11" (Bilangan Pertanian), "4.12" (Nilai Pertanian), "4.13"
// (Bilangan & Nilai Tanah Pembangunan) - setiap satu berbentuk
// (Jenis Tanah) x (Daerah) x (3 suku terkini: Q sama tahun lepas, Q sebelum, Q semasa).
// Kita ambil suku PALING BAHARU sahaja (lajur ketiga dalam setiap kumpulan 3 baris).
//
// Guna: node scripts/import-napic-harga-tanah.js <fail.xlsx> <Negeri>
// Cth:  node scripts/import-napic-harga-tanah.js "./Jadual Transaksi Harta Tanah Selangor Q1 2026.xlsx" Selangor

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Jenis pertanian yang dijumlahkan jadi satu kategori PERTANIAN (semuanya guna
// tanah bukan-bandar, hanya beza tanaman). "Vacant Land" & "Others"/"Total"
// dilayan berasingan (lihat bawah).
const SUBJENIS_PERTANIAN = new Set([
  "Estate",
  "Rubber",
  "Oil Palm",
  "Paddy",
  "Orchard",
  "Durian",
  "Horticulture/Vegetable",
]);

function cariBarisHeader(rows) {
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1] ?? "").trim() === "Quarter") return i;
  }
  throw new Error('Tidak jumpa baris header ("Quarter").');
}

function parseSukuan(label) {
  // "Q1 2026 P" -> { tahun: 2026, sukuan: "Q1" }
  const m = String(label).match(/Q(\d)\s*(\d{4})/);
  if (!m) return null;
  return { sukuan: `Q${m[1]}`, tahun: parseInt(m[2], 10) };
}

function skorSukuan(info) {
  return info.tahun * 10 + parseInt(info.sukuan.slice(1), 10);
}

// Nombor jadual (nama tab, cth "4.11") ikut KEDUDUKAN negeri dalam senarai
// fail NAPIC (Selangor=4, Johor=5, dst) - jadi berbeza tiap fail negeri. Cari
// sheet betul ikut TEKS TAJUK (baris ke-2 sheet), bukan nama tab.
function cariSheetIkutTajuk(wb, serpihanTajuk) {
  const nama = wb.SheetNames.find((n) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "" });
    return (rows[1] || []).join(" ").toLowerCase().includes(serpihanTajuk);
  });
  if (!nama) throw new Error(`Tidak jumpa sheet dengan tajuk mengandungi: "${serpihanTajuk}"`);
  return wb.Sheets[nama];
}

// Templat NAPIC selalu bandingkan 3 suku (Q sama tahun lepas, Q sebelum, Q
// semasa) per kumpulan - had ini elak baris kosong susulan (spacer/EOF) tertelan
// masuk kumpulan terakhir dalam sheet.
const BILANGAN_SUKU = 3;

// NAPIC hanya label teks suku (lajur "Quarter") pada kumpulan PERTAMA sahaja -
// kumpulan jenis seterusnya kekal kosong pada lajur tu (bukan merged cell,
// cuma kosong dalam fail asal - kedudukan baris dalam kumpulan 3 baris yang
// tentukan suku, bukan teksnya). Jadi cari suku "semasa" (paling baharu)
// SEKALI untuk seluruh sheet, pakai untuk semua kumpulan.
function cariSukuanSemasaGlobal(rows, headerIdx) {
  let terbaharu = null;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const info = parseSukuan(rows[i][1]);
    if (info && (!terbaharu || skorSukuan(info) > skorSukuan(terbaharu))) terbaharu = info;
  }
  if (!terbaharu) throw new Error("Tidak jumpa mana-mana label suku (cth 'Q1 2026') dalam sheet.");
  return terbaharu;
}

// Baca satu sheet "bilangan" atau "nilai" (struktur 4.11/4.12): kumpulan 3 baris
// (Q tahun lepas, Q sebelum, Q semasa - ikut KEDUDUKAN, bukan teks) per jenis
// tanah. Pulangkan hanya suku PALING BAHARU (baris terakhir tiap kumpulan):
// Map<jenisAsal, { tahun, sukuan, nilai: Map<daerah, number> }>
function bacaKumpulanTigaSuku(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headerIdx = cariBarisHeader(rows);
  const header = rows[headerIdx];
  const daerahCols = []; // { col, daerah }
  for (let c = 2; c < header.length; c++) {
    const label = String(header[c] ?? "").trim();
    if (!label || /^total$/i.test(label)) continue;
    daerahCols.push({ col: c, daerah: label });
  }

  const sukuanSemasa = cariSukuanSemasaGlobal(rows, headerIdx);
  const hasil = new Map();
  let jenisSemasa = null;
  let kumpulanSemasa = [];

  const prosesKumpulan = () => {
    if (!jenisSemasa || kumpulanSemasa.length === 0) return;
    if (!/^(others|total)$/i.test(jenisSemasa)) {
      const barisTerakhir = kumpulanSemasa[kumpulanSemasa.length - 1];
      const perDaerah = new Map();
      for (const { col, daerah } of daerahCols) {
        perDaerah.set(daerah, Number(barisTerakhir[col]) || 0);
      }
      hasil.set(jenisSemasa, { ...sukuanSemasa, nilai: perDaerah });
    }
    kumpulanSemasa = [];
  };

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const jenisLabel = String(row[0] ?? "").trim();
    if (jenisLabel) {
      prosesKumpulan();
      jenisSemasa = jenisLabel;
    }
    if (jenisSemasa && kumpulanSemasa.length < BILANGAN_SUKU) kumpulanSemasa.push(row);
  }
  prosesKumpulan();

  return { daerahCols, hasil };
}

// Sheet 4.13 (Development Land): baris "Number" (3 suku) diikuti baris
// "Value (RM Million)" (3 suku) - bukan per-jenis, jadi struktur ringkas.
function bacaTanahPembangunan(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headerIdx = cariBarisHeader(rows);
  const header = rows[headerIdx];
  const daerahCols = [];
  for (let c = 2; c < header.length; c++) {
    const label = String(header[c] ?? "").trim();
    if (!label || /^total$/i.test(label)) continue;
    daerahCols.push({ col: c, daerah: label });
  }

  const sukuanSemasa = cariSukuanSemasaGlobal(rows, headerIdx);
  const kumpulan = { Number: [], Value: [] };
  let kunciSemasa = null;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const label = String(row[0] ?? "").trim();
    if (/^number$/i.test(label)) kunciSemasa = "Number";
    else if (/^value/i.test(label)) kunciSemasa = "Value";
    if (kunciSemasa && kumpulan[kunciSemasa].length < BILANGAN_SUKU) kumpulan[kunciSemasa].push(row);
  }

  // baris TERAKHIR dalam tiap kumpulan (kedudukan) = suku paling baharu
  const barisNumber = kumpulan.Number[kumpulan.Number.length - 1];
  const barisValue = kumpulan.Value[kumpulan.Value.length - 1];
  if (!barisNumber || !barisValue) return null;

  const bilangan = new Map();
  const nilai = new Map();
  for (const { col, daerah } of daerahCols) {
    bilangan.set(daerah, Number(barisNumber[col]) || 0);
    nilai.set(daerah, Number(barisValue[col]) || 0);
  }

  return { ...sukuanSemasa, bilangan, nilai };
}

async function main() {
  const [, , filePath, negeriArg] = process.argv;
  if (!filePath || !negeriArg) {
    console.error("Guna: node scripts/import-napic-harga-tanah.js <fail.xlsx> <Negeri>");
    process.exit(1);
  }
  const negeri = negeriArg;
  const sumberFail = path.basename(filePath);
  const wb = XLSX.readFile(filePath);

  const rekod = []; // { daerah, jenisTanah, tahun, sukuan, bilangan, nilaiRmMillion }

  // ---- Pertanian: gabung sheet "bilangan" + "nilai" (cari ikut tajuk, bukan nama tab) ----
  const bilanganPertanian = bacaKumpulanTigaSuku(
    cariSheetIkutTajuk(wb, "agricultural property transactions according to type, price")
  );
  const nilaiPertanian = bacaKumpulanTigaSuku(
    cariSheetIkutTajuk(wb, "value of agricultural property transactions according to type")
  );

  const jumlahkanJenis = (peta, senaraiJenis) => {
    // peta: hasil bacaKumpulanTigaSuku().hasil - jumlahkan beberapa jenis (by daerah)
    let tahun, sukuan;
    const totalPerDaerah = new Map();
    for (const jenis of senaraiJenis) {
      const entri = peta.get(jenis);
      if (!entri) continue;
      tahun = entri.tahun;
      sukuan = entri.sukuan;
      for (const [daerah, nilai] of entri.nilai) {
        totalPerDaerah.set(daerah, (totalPerDaerah.get(daerah) || 0) + nilai);
      }
    }
    return tahun ? { tahun, sukuan, nilai: totalPerDaerah } : null;
  };

  const kosongBilangan = bilanganPertanian.hasil.get("Vacant Land");
  const kosongNilai = nilaiPertanian.hasil.get("Vacant Land");
  const pertanianBilangan = jumlahkanJenis(bilanganPertanian.hasil, [...SUBJENIS_PERTANIAN]);
  const pertanianNilai = jumlahkanJenis(nilaiPertanian.hasil, [...SUBJENIS_PERTANIAN]);

  const tambahRekod = (jenisTanah, entriBilangan, entriNilai) => {
    if (!entriBilangan || !entriNilai) return;
    for (const [daerah, bilangan] of entriBilangan.nilai) {
      const nilaiRmMillion = entriNilai.nilai.get(daerah) || 0;
      rekod.push({
        daerah,
        jenisTanah,
        tahun: entriBilangan.tahun,
        sukuan: entriBilangan.sukuan,
        bilangan: Math.round(bilangan),
        nilaiRmMillion,
      });
    }
  };

  tambahRekod("KOSONG", kosongBilangan, kosongNilai);
  tambahRekod("PERTANIAN", pertanianBilangan, pertanianNilai);

  // ---- Tanah Pembangunan: cari ikut tajuk ----
  const pembangunan = bacaTanahPembangunan(cariSheetIkutTajuk(wb, "development land"));
  if (pembangunan) {
    for (const [daerah, bilangan] of pembangunan.bilangan) {
      rekod.push({
        daerah,
        jenisTanah: "PEMBANGUNAN",
        tahun: pembangunan.tahun,
        sukuan: pembangunan.sukuan,
        bilangan: Math.round(bilangan),
        nilaiRmMillion: pembangunan.nilai.get(daerah) || 0,
      });
    }
  }

  console.log(`${rekod.length} rekod diproses dari ${sumberFail} (${negeri}).`);

  let ditulis = 0;
  for (const r of rekod) {
    const nilaiSen = BigInt(Math.round(r.nilaiRmMillion * 1_000_000 * 100));
    await prisma.napicRujukanHarga.upsert({
      where: {
        negeri_daerah_tahun_sukuan_jenisTanah_julatHargaMin: {
          negeri,
          daerah: r.daerah,
          tahun: r.tahun,
          sukuan: r.sukuan,
          jenisTanah: r.jenisTanah,
          julatHargaMin: 0,
        },
      },
      create: {
        negeri,
        daerah: r.daerah,
        tahun: r.tahun,
        sukuan: r.sukuan,
        jenisTanah: r.jenisTanah,
        julatHargaMin: 0,
        julatHargaMax: null,
        bilangan: r.bilangan,
        nilaiSen,
        sumberFail,
      },
      update: {
        bilangan: r.bilangan,
        nilaiSen,
        sumberFail,
      },
    });
    ditulis++;
  }

  console.log(`Selesai. ${ditulis} baris NapicRujukanHarga ditulis/dikemaskini.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
