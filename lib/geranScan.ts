// Membaca butiran daripada imbasan/gambar geran hakmilik dan memulangkannya
// dalam bentuk yang terus boleh mengisi borang penyenaraian admin.
//
// Reka bentuk penting: SETIAP medan boleh null. Model diarah memulangkan null
// bila ia tak dapat membaca sesuatu dengan yakin, dan tak sekali-kali meneka.
// Sebabnya praktikal - nilai yang salah tapi kelihatan munasabah akan lepas
// pandangan admin dan tersiar kepada pembeli, sedangkan medan kosong jelas
// menuntut perhatian. Borang ini mengisi apa yang datang dan membiarkan
// selebihnya kosong.
//
// Modul ini PELAYAN SAHAJA - ia memegang kunci API.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import sharp from "sharp";
import { z } from "zod";
import { NEGERI_LIST } from "@/lib/aduanTanah";

// Claude mengecilkan imej melebihi 1568px pada tepi panjang, jadi menghantar
// yang lebih besar hanya membazir bandwidth dan token tanpa menambah ketepatan.
const TEPI_MAKS = 1568;

const negeriTuple = NEGERI_LIST as [string, ...string[]];

// Skema diberi kepada model sebagai JSON Schema, bukan melalui pembantu Zod
// SDK: pembantu itu memerlukan Zod v4, sedangkan projek ini mengesahkan setiap
// route API dengan Zod 3. Menaik taraf Zod hanya untuk satu ciri akan
// menyentuh semua pengesahan itu. Jadi model dikekang oleh JSON Schema di
// bawah, dan apa yang pulang tetap disahkan semula dengan skema Zod 3 kita
// sendiri sebelum dipercayai.
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "negeri",
    "daerahMukim",
    "nomborLot",
    "nomborGeran",
    "jenisTanah",
    "jenisHakmilik",
    "statusPemilikan",
    "keluasan",
    "unitKeluasan",
    "nota",
  ],
  properties: {
    negeri: { type: ["string", "null"], enum: [...NEGERI_LIST, null] },
    daerahMukim: { type: ["string", "null"] },
    nomborLot: { type: ["string", "null"] },
    nomborGeran: { type: ["string", "null"] },
    jenisTanah: {
      type: ["string", "null"],
      enum: ["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL", null],
    },
    jenisHakmilik: { type: ["string", "null"], enum: ["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI", null] },
    statusPemilikan: {
      type: ["string", "null"],
      enum: ["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI", null],
    },
    keluasan: { type: ["number", "null"] },
    unitKeluasan: { type: ["string", "null"], enum: ["SQFT", "EKAR", "HEKTAR", null] },
    nota: { type: "string" },
  },
} as const;

export const skemaImbasGeran = z.object({
  negeri: z.enum(negeriTuple).nullable(),
  daerahMukim: z.string().nullable(),
  nomborLot: z.string().nullable(),
  nomborGeran: z.string().nullable(),
  jenisTanah: z
    .enum(["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL"])
    .nullable(),
  jenisHakmilik: z.enum(["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI"]).nullable(),
  statusPemilikan: z.enum(["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI"]).nullable(),
  keluasan: z.number().nullable(),
  unitKeluasan: z.enum(["SQFT", "EKAR", "HEKTAR"]).nullable(),
  // Apa yang tak dapat dibaca, kabur, atau mengelirukan - dipapar kepada admin
  // supaya dia tahu ke mana nak pandang pada dokumen asal.
  nota: z.string(),
});

export type HasilImbasGeran = z.infer<typeof skemaImbasGeran>;

const ARAHAN = `Anda membaca hakmilik tanah Malaysia (geran) dan mengeluarkan butiran lot untuk mengisi borang penyenaraian.

PERATURAN PALING PENTING: pulangkan null untuk mana-mana medan yang anda tak dapat baca dengan yakin daripada dokumen. Jangan sekali-kali meneka, menganggar, atau menyimpulkan daripada kebiasaan. Medan kosong tidak memudaratkan; medan yang salah akan tersiar kepada pembeli tanah dan boleh menyesatkan urus niaga bernilai ratusan ribu ringgit.

Panduan membaca jenis hakmilik:
- "Geran" (GRN) atau "Geran Mukim" (GM) tanpa tempoh pajakan -> FREEHOLD
- "Pajakan Negeri" (PN), "Pajakan Mukim" (PM), atau ada tarikh tamat pajakan -> LEASEHOLD
- "HSD"/"HSM" (hakmilik sementara) boleh jadi mana-mana - baca tempoh pajakan; kalau tiada, pulangkan TIDAK_PASTI
- Ragu-ragu -> TIDAK_PASTI

Panduan kategori kegunaan tanah:
- "Pertanian" -> PERTANIAN
- "Industri" -> PERINDUSTRIAN
- "Bangunan" bermakna KEDIAMAN atau KOMERSIAL dan dokumen selalunya tak membezakannya - pulangkan null dan sebut dalam nota
- Tiada kategori dinyatakan -> null

Panduan status pemilikan:
- Endorsan atau cop "Tanah Rizab Melayu" / "Malay Reserve" -> RIZAB_MELAYU
- Sekatan kepentingan yang menyebut pemindahan kepada Bumiputera sahaja -> LOT_BUMI
- Sekatan kepentingan dinyatakan dengan jelas TIADA sekatan kaum -> LOT_NON_BUMI
- Tidak dinyatakan atau tak dapat dibaca -> TIDAK_PASTI

Keluasan: pulangkan nombor dan unitnya seperti tertulis. Kalau dokumen menyebut meter persegi, tukarkan kepada kaki persegi (1 m2 = 10.7639 kp) dan sebut penukaran itu dalam nota. Jangan bundarkan secara agresif.

JANGAN pulangkan nama pemilik, nombor kad pengenalan, atau alamat. Maklumat itu tak diperlukan borang ini dan tak sepatutnya keluar daripada dokumen.

Dalam "nota", tulis satu atau dua ayat ringkas dalam Bahasa Melayu tentang apa yang kabur, terpotong, atau mengelirukan. Kalau semuanya jelas, tulis "Semua medan dibaca dengan jelas."`;

export class RalatKunciApi extends Error {}

export async function imbasGeranDariImej(bufferImej: Buffer): Promise<HasilImbasGeran> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new RalatKunciApi("ANTHROPIC_API_KEY belum ditetapkan.");
  }

  // Normalkan kepada JPEG bersaiz munasabah. Ini juga menanggalkan metadata
  // EXIF (termasuk koordinat GPS tempat gambar diambil) kerana sharp tak
  // membawanya masuk melainkan diminta.
  const disediakan = await sharp(bufferImej)
    .rotate() // hormati orientasi EXIF sebelum ia dibuang
    .resize(TEPI_MAKS, TEPI_MAKS, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: ARAHAN,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: disediakan.toString("base64") },
          },
          { type: "text", text: "Keluarkan butiran lot daripada hakmilik ini." },
        ],
      },
    ],
    output_config: { format: jsonSchemaOutputFormat(JSON_SCHEMA) },
  });

  if (!response.parsed_output) {
    throw new Error("Tak dapat membaca butiran daripada imej ini.");
  }

  // Structured output mengekang model, tapi ia bukan jaminan yang kita boleh
  // bergantung sepenuhnya - sahkan semula sebelum nilainya masuk ke borang.
  const disahkan = skemaImbasGeran.safeParse(response.parsed_output);
  if (!disahkan.success) {
    throw new Error("Bacaan pulang dalam bentuk yang tak dijangka.");
  }
  return disahkan.data;
}
