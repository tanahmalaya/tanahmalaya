// Menghurai iklan tanah berbentuk teks bebas (dari kumpulan WhatsApp/Telegram)
// kepada medan borang penyenaraian.
//
// Tiada kecerdasan buatan dan tiada kos - hanya padanan corak. Ia berkesan di
// sini kerana iklan tanah Malaysia menggunakan perbendaharaan kata yang sempit
// dan berulang: "3 ekar", "geran individu", "rizab melayu", "RM450k". Penghurai
// mengenali kosa kata itu dan mengabaikan selebihnya.
//
// Prinsip yang sama seperti mana-mana pengisi borang automatik di sini: SETIAP
// medan boleh null, dan apa yang tak pasti dibiarkan kosong. Nilai yang salah
// tapi munasabah akan lepas pandangan admin; medan kosong menuntut perhatian.
//
// Modul ini tulen - tiada import pelayar atau pelayan - supaya ia boleh diuji
// terus dalam Node terhadap iklan sebenar.

import { NEGERI_LIST } from "@/lib/aduanTanah";

export type HasilHurai = {
  negeri: string | null;
  daerahMukim: string | null;
  nomborLot: string | null;
  jenisTanah: string | null;
  jenisHakmilik: string | null;
  statusPemilikan: string | null;
  keluasan: number | null;
  unitKeluasan: string | null;
  hargaRM: number | null;
  nota: string[];
};

// Nama negeri seperti ditulis orang dalam iklan, dipetakan ke nilai rasmi.
const ALIAS_NEGERI: Record<string, string> = {
  "kuala lumpur": "Wilayah Persekutuan Kuala Lumpur",
  kl: "Wilayah Persekutuan Kuala Lumpur",
  wpkl: "Wilayah Persekutuan Kuala Lumpur",
  putrajaya: "Wilayah Persekutuan Putrajaya",
  labuan: "Wilayah Persekutuan Labuan",
  "n9": "Negeri Sembilan",
  "n.sembilan": "Negeri Sembilan",
  nsembilan: "Negeri Sembilan",
  penang: "Pulau Pinang",
  pinang: "Pulau Pinang",
  "p.pinang": "Pulau Pinang",
  ppinang: "Pulau Pinang",
  malacca: "Melaka",
  terengganu: "Terengganu",
  trengganu: "Terengganu",
  johore: "Johor",
  pahang: "Pahang",
};

const KATA_JENIS_TANAH: Array<[RegExp, string]> = [
  [/\b(pertanian|kebun|ladang|sawah|dusun|getah|sawit|kelapa|durian|agricultur\w*)\b/i, "PERTANIAN"],
  [/\b(perindustrian|industri|kilang|industrial)\b/i, "PERINDUSTRIAN"],
  [/\b(komersial|komersil|perniagaan|kedai|commercial)\b/i, "KOMERSIAL"],
  [/\b(perumahan|kediaman|rumah|residential|taman perumahan)\b/i, "PERUMAHAN"],
  [/\b(pembangunan|development)\b/i, "PEMBANGUNAN"],
  [/\b(tanah kosong|kosong|lapang|vacant)\b/i, "KOSONG"],
];

const KATA_HAKMILIK: Array<[RegExp, string]> = [
  // Pajakan diperiksa DAHULU: "geran pajakan" wujud, dan padanan "geran"
  // yang terlebih dahulu akan salah melabelkannya sebagai freehold.
  [/\b(pajakan|leasehold|lease\s*hold|99\s*tahun|66\s*tahun|60\s*tahun|pn\s*\d)\b/i, "LEASEHOLD"],
  [/\b(freehold|free\s*hold|geran\s*(kekal|individu|selamanya)|kekal)\b/i, "FREEHOLD"],
];

const KATA_PEMILIKAN: Array<[RegExp, string]> = [
  [/\b(rizab\s*melayu|reza[bp]\s*melayu|simpanan\s*melayu|malay\s*reserve|trm)\b/i, "RIZAB_MELAYU"],
  [/\b(bukan\s*bumi|non[\s-]*bumi|nonbumi)\b/i, "LOT_NON_BUMI"],
  [/\b(lot\s*bumi|bumi\s*lot|bumiputera|bumiputra)\b/i, "LOT_BUMI"],
];

// Unit keluasan. "relong" sengaja TIDAK ditukar: nilainya berbeza mengikut
// negeri (kira-kira 0.71 ekar di Kedah/Perlis tetapi tidak di mana-mana), jadi
// menukarnya secara senyap akan menghasilkan keluasan yang salah pada
// penyenaraian yang dijual dengan harga ratusan ribu.
const UNIT: Array<[RegExp, string]> = [
  [/\b(ekar|acres?|ekar)\b/i, "EKAR"],
  [/\b(hektar|hektar|hectares?|ha)\b/i, "HEKTAR"],
  [/\b(kaki\s*persegi|kaki\s*p|kp|sq\.?\s*ft|sqft|square\s*feet|ft2)\b/i, "SQFT"],
];

function nombor(teks: string): number | null {
  const bersih = teks.replace(/,/g, "").trim();
  const n = Number(bersih);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cariNegeri(teks: string): string | null {
  const rendah = teks.toLowerCase();
  // Nama rasmi didahulukan supaya "Pulau Pinang" tak tersangkut pada alias
  // "pinang" yang lebih pendek dan memberi jawapan sama.
  for (const negeri of NEGERI_LIST) {
    if (rendah.includes(negeri.toLowerCase())) return negeri;
  }
  for (const [alias, negeri] of Object.entries(ALIAS_NEGERI)) {
    const corak = new RegExp(`(^|[^a-z])${alias.replace(/\./g, "\\.")}([^a-z]|$)`, "i");
    if (corak.test(rendah)) return negeri;
  }
  return null;
}

function cariDaerah(teks: string): string | null {
  // Iklan hampir selalu menandakan lokasi dengan salah satu kata kunci ini.
  // Tanpa kata kunci kita tak meneka - "di Kuala Selangor" boleh jadi daerah,
  // mukim, atau nama taman, dan tekaan yang salah lebih teruk daripada kosong.
  const corak = [
    /\b(?:mukim|daerah|district)\s*:?\s*([A-Za-zÀ-ÿ'.\s]{3,40}?)(?=[,\n.]|$|\s*\b(?:negeri|selangor|johor|kedah|kelantan|melaka|pahang|perak|perlis|sabah|sarawak|terengganu)\b)/i,
    /\b(?:lokasi|location|kawasan)\s*:?\s*([A-Za-zÀ-ÿ'.\s]{3,40}?)(?=[,\n]|$)/i,
  ];
  for (const c of corak) {
    const padan = teks.match(c);
    if (padan?.[1]) {
      const nilai = padan[1].replace(/\s+/g, " ").trim().replace(/[,.]$/, "");
      if (nilai.length >= 3) return nilai;
    }
  }
  return null;
}

function cariKeluasan(teks: string): { keluasan: number | null; unit: string | null; nota: string[] } {
  const nota: string[] = [];

  if (/\brelong\b/i.test(teks)) {
    nota.push(
      "The ad mentions 'relong' — its value differs by state, so the size was not filled in. Convert it yourself."
    );
  }

  for (const [corak, unit] of UNIT) {
    // Nombor mesti berada betul-betul sebelum unit, dengan ruang pilihan.
    const cari = new RegExp(`([\\d][\\d,]*(?:\\.\\d+)?)\\s*${corak.source.replace(/^\\b|\\b$/g, "")}`, "i");
    const padan = teks.match(cari);
    if (padan) {
      const nilai = nombor(padan[1]);
      if (nilai !== null) return { keluasan: nilai, unit, nota };
    }
  }
  return { keluasan: null, unit: null, nota };
}

// Julat waras untuk harga tanah Malaysia. Apa-apa di luar ini hampir pasti
// salah baca, bukan tawaran sebenar.
const HARGA_MIN = 1_000;
const HARGA_MAKS = 500_000_000;

function cariHarga(teks: string): { harga: number | null; nota: string[] } {
  const nota: string[] = [];
  const calon: Array<{ nilai: number; yakin: number }> = [];

  const gandaan = (akhiran: string): number => {
    const a = akhiran.toLowerCase();
    if (/^(juta|jt|mil|million|m)$/.test(a)) return 1_000_000;
    if (/^(ribu|rb|k)$/.test(a)) return 1_000;
    return 1;
  };

  // Keyakinan tinggi: nombor yang betul-betul berlabel RM. Jurang sebelum
  // akhiran sengaja [ \t]* dan bukan \s* - membenarkan baris baharu di situ
  // bermakna "RM 450,000" boleh tersambung dengan sampah OCR pada baris
  // seterusnya dan menjadi berjuta-juta.
  for (const p of Array.from(
    teks.matchAll(/rm\s*([\d][\d,]*(?:\.\d+)?)[ \t]*(juta|jt|mil(?:lion)?|m|ribu|rb|k)?\b/gi)
  )) {
    const n = nombor(p[1]);
    if (n !== null) calon.push({ nilai: n * gandaan(p[2] ?? ""), yakin: 2 });
  }

  // Keyakinan rendah: tiada "RM", jadi hanya akhiran PERKATAAN PENUH diterima.
  // Huruf tunggal "m" dan "k" tanpa RM terlalu mudah datang daripada sampah
  // OCR - cap masa "10:42 PM" pernah dibaca sebagai "10427M" dan menghasilkan
  // harga sepuluh bilion ringgit yang mengalahkan baris harga yang betul.
  for (const p of Array.from(teks.matchAll(/([\d][\d,]*(?:\.\d+)?)[ \t]*(juta|jt|ribu)\b/gi))) {
    const n = nombor(p[1]);
    if (n !== null) calon.push({ nilai: n * gandaan(p[2]), yakin: 1 });
  }

  const waras = calon.filter((c) => c.nilai >= HARGA_MIN && c.nilai <= HARGA_MAKS);
  if (calon.length > 0 && waras.length === 0) {
    nota.push("A number looks like a price but is outside a sensible range — the price was not filled in.");
  }
  if (waras.length === 0) return { harga: null, nota };

  waras.sort((a, b) => b.yakin - a.yakin);
  const terpilih = waras[0];

  if (/\bse\s*(?:ekar|kaki|ka?p)\b|\/\s*(?:ekar|kp|kaki)/i.test(teks)) {
    nota.push("The price in the ad looks like a PER-UNIT price, not the total price — please check.");
  }
  return { harga: terpilih.nilai, nota };
}

function cariLot(teks: string): string | null {
  const padan =
    teks.match(/\b(?:no\.?\s*lot|lot\s*no\.?|lot)\s*:?\s*([A-Z]{0,3}\s?\d[\d\/-]*)/i) ||
    teks.match(/\b(pt\s*\d[\d\/-]*)/i);
  return padan ? padan[1].replace(/\s+/g, " ").trim() : null;
}

function padanPertama(teks: string, senarai: Array<[RegExp, string]>): string | null {
  for (const [corak, nilai] of senarai) {
    if (corak.test(teks)) return nilai;
  }
  return null;
}

export function huraiIklanTanah(teksMentah: string): HasilHurai {
  const teks = teksMentah.replace(/ /g, " ");
  const nota: string[] = [];

  const { keluasan, unit, nota: notaLuas } = cariKeluasan(teks);
  const { harga, nota: notaHarga } = cariHarga(teks);
  nota.push(...notaLuas, ...notaHarga);

  const hasil: HasilHurai = {
    negeri: cariNegeri(teks),
    daerahMukim: cariDaerah(teks),
    nomborLot: cariLot(teks),
    jenisTanah: padanPertama(teks, KATA_JENIS_TANAH),
    jenisHakmilik: padanPertama(teks, KATA_HAKMILIK),
    statusPemilikan: padanPertama(teks, KATA_PEMILIKAN),
    keluasan,
    unitKeluasan: unit,
    hargaRM: harga,
    nota,
  };

  return hasil;
}
