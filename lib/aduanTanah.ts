// Pilihan & label kongsi untuk Borang Aduan Pencerobohan Tanah - diguna oleh
// borang awam (components/aduan/AduanTanahForm.tsx) dan paparan admin
// (app/admin/(protected)/aduan-tanah).

export const NEGERI_LIST = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan Kuala Lumpur",
  "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
];

export const HUBUNGAN_OPTIONS: { value: string; label: string }[] = [
  { value: "PEMILIK_BERDAFTAR", label: "Pemilik Tanah Berdaftar" },
  { value: "JIRAN_PENDUDUK", label: "Jiran / Penduduk Berhampiran" },
  { value: "WAKAF_AMANAH", label: "Wakaf / Pemegang Amanah" },
  { value: "WAKIL_KOMUNITI_NGO", label: "Wakil Komuniti / NGO" },
  { value: "ORANG_AWAM", label: "Orang Awam" },
];

export const KATEGORI_TANAH_OPTIONS: { value: string; label: string }[] = [
  { value: "KERAJAAN_RIZAB", label: "Tanah Kerajaan / Rizab Awam (Jalan, Sungai, Hutan)" },
  { value: "PERSENDIRIAN", label: "Tanah Persendirian / Milik Individu" },
  { value: "ADAT_RIZAB_MELAYU", label: "Tanah Adat / Rizab Melayu" },
  { value: "TIDAK_PASTI", label: "Tidak Pasti" },
];

export const JENIS_PENCEROBOHAN_OPTIONS: { value: string; label: string }[] = [
  { value: "STRUKTUR_HARAM", label: "Pembinaan Struktur / Kediaman Haram" },
  { value: "PERTANIAN_PENTERNAKAN", label: "Pencerobohan Untuk Pertanian / Penternakan" },
  { value: "PENEROKAAN_HUTAN", label: "Penerokaan / Penebangan Hutan / Ratakan Tanah" },
  { value: "SAMPAH_SISA", label: "Pembuangan Sampah / Sisa Toksik / Sisa Binaan Haram" },
  { value: "PENGOREKAN_PASIR", label: "Pengorekan Pasir / Sumber Alam Tanpa Permit" },
  { value: "HALANGAN_LALUAN", label: "Halangan Laluan Awam / Pagar Haram" },
  { value: "LAIN_LAIN", label: "Lain-lain (Nyatakan)" },
];

export const STATUS_ADUAN_LABEL: Record<string, string> = {
  BAHARU: "Baharu",
  DALAM_SEMAKAN: "Dalam Semakan",
  SELESAI: "Selesai",
};

function toLabelMap(options: { value: string; label: string }[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

export const HUBUNGAN_LABEL = toLabelMap(HUBUNGAN_OPTIONS);
export const KATEGORI_TANAH_LABEL = toLabelMap(KATEGORI_TANAH_OPTIONS);
export const JENIS_PENCEROBOHAN_LABEL = toLabelMap(JENIS_PENCEROBOHAN_OPTIONS);
