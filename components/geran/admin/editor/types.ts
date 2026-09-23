import type { Penanda } from "@/lib/geran/penanda";
import type { PenandaPeta } from "@/lib/geran/peta";
import type { Hotspot } from "@/lib/geran/panorama";
import type { StatusGeranKey } from "@/lib/geran/status";

// Bentuk data Land Listing Editor. Semua wang dalam RM sebagai rentetan
// (macam HargaInput simpan) supaya medan kosong kekal kosong, bukan 0.

export type StatusLotKey = "AVAILABLE" | "RESERVED" | "SOLD";

export type LotForm = {
  // Kunci stabil untuk React - sama dengan id rekod bila lot dah disimpan,
  // atau id sementara ("baru-...") untuk lot yang baru ditambah.
  kunci: string;
  id: string | null;
  noLot: string;
  status: StatusLotKey;
  keluasan: string;
  unitKeluasan: string;
  tenure: string; // "" = tidak ditetapkan
  kategori: string; // "" = ikut kategori penyenaraian
  hargaRM: string;
  nomborGeran: string;
  latitude: string;
  longitude: string;
  nota: string;
};

// Satu panorama 360°. lotId & hotspot.lotId merujuk LotForm.kunci;
// hotspot.keScene merujuk PanoramaForm.kunci - kedua-duanya ditukar ke id
// sebenar oleh pelayan semasa simpan (sama seperti penanda).
export type PanoramaForm = {
  kunci: string;
  id: string | null;
  url: string;
  tajuk: string;
  latitude: string;
  longitude: string;
  lotId: string; // "" = tiada
  yawAwal: number;
  hotspots: Hotspot[];
};

export type EditorForm = {
  tajuk: string;
  sumber: string;
  jenisTanah: string;
  jenisHakmilik: string;
  statusPemilikan: string;
  keluasan: string;
  unitKeluasan: string;
  nomborLot: string;
  nomborGeran: string;
  keterangan: string;

  negeri: string;
  daerahMukim: string;
  mukim: string;
  alamat: string;
  latitude: string;
  longitude: string;

  namaPenjual: string;
  telefonPenjual: string;
  emelPenjual: string;

  hargaPasaranRM: string;
  hargaAmbilRM: string;
  hargaSiaranRM: string;
  catatanRundingan: string;

  gambarUrls: string[];
  // Bentuk Lot Marker. lotId dalam penanda merujuk LotForm.kunci (bukan id),
  // supaya lot yang belum disimpan pun boleh dipaut.
  penanda: Penanda;
  // Bentuk atas peta satelit - [lng, lat]; lotId juga merujuk LotForm.kunci.
  penandaPeta: PenandaPeta;
  panorama: PanoramaForm[];

  seoTitle: string;
  seoDescription: string;

  status: StatusGeranKey;
  catatanAdmin: string;

  lots: LotForm[];
};

// Maklumat baca-sahaja yang editor papar tapi tak simpan.
export type EditorMeta = {
  id: string;
  seq: number;
  hargaDimintaSen: number | null; // harga penjual minta (PENGGUNA sahaja)
  adaSalinanGeran: boolean;
  dariPenjual: boolean; // penyenaraian dihantar melalui /geran/jual
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  // Bilangan lot yang baru ditukar dari polygon format lama semasa halaman
  // dibuka - belum tersimpan sehingga admin tekan Save.
  lotWarisan: number;
};

export type UbahForm = (perubahan: Partial<EditorForm>) => void;

export const INPUT =
  "w-full h-10 rounded-lg border border-black/[0.12] bg-white px-3 text-sm text-[#0E2A20] placeholder-black/30 outline-none transition focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-black/[0.03] disabled:text-black/45";
// Pasangan "nombor + unit" dalam satu baris: INPUT ada w-full, jadi versi
// tanpa lebar diperlukan - kalau tidak w-full & w-28 bercanggah dan medan
// nombor terhimpit.
const INPUT_TANPA_LEBAR = INPUT.replace("w-full ", "");
export const INPUT_NOMBOR = `${INPUT_TANPA_LEBAR} min-w-0 flex-1`;
export const INPUT_UNIT = `${INPUT_TANPA_LEBAR} w-28 shrink-0`;
export const TEXTAREA =
  "w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2.5 text-sm text-[#0E2A20] placeholder-black/30 outline-none transition focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/15";
export const LABEL = "block text-[12.5px] font-semibold text-black/60 mb-1.5";
export const KAD = "bg-white rounded-2xl border border-black/[0.06] shadow-sm shadow-black/[0.02]";
