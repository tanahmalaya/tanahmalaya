// Lencana status pemilikan tanah, dikongsi antara jadual dashboard admin dan
// borang edit. Warna dipilih mengikut apa yang admin perlu buat, bukan sekadar
// untuk membezakan nilai:
//
//   TIDAK_PASTI  - kuning amaran; ia bermakna kerja BELUM SIAP. Penyenaraian
//                  yang tersiar dengan status ini meninggalkan pembeli tanpa
//                  jawapan kepada soalan pertamanya, jadi ia patut menonjol
//                  dalam senarai, bukan hilang sebagai kelabu neutral.
//   RIZAB_MELAYU - amber; sekatan paling ketat
//   LOT_BUMI     - biru; sekatan bersyarat
//   LOT_NON_BUMI - hijau; tiada sekatan kaum

import { STATUS_PEMILIKAN_LABEL } from "@/lib/geran";

const WARNA: Record<string, string> = {
  RIZAB_MELAYU: "bg-amber-100 text-amber-800 border-amber-200",
  LOT_BUMI: "bg-sky-100 text-sky-800 border-sky-200",
  LOT_NON_BUMI: "bg-emerald-100 text-emerald-800 border-emerald-200",
  TIDAK_PASTI: "bg-yellow-50 text-yellow-700 border-yellow-300",
};

export default function StatusPemilikanBadge({
  status,
  saiz = "biasa",
}: {
  status: string;
  saiz?: "biasa" | "kecil";
}) {
  const label = STATUS_PEMILIKAN_LABEL[status] ?? status;
  const perluSemak = status === "TIDAK_PASTI";

  return (
    <span
      title={perluSemak ? "Belum disahkan daripada salinan geran" : label}
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        saiz === "kecil" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${WARNA[status] ?? "bg-black/5 text-brand-dark/60 border-black/10"}`}
    >
      {perluSemak && <span aria-hidden="true">⚠</span>}
      {label}
    </span>
  );
}
