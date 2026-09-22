"use client";

// "Imbas geran" di atas borang tambah penyenaraian. Admin lampirkan gambar
// hakmilik, dan medan borang diisi daripada apa yang terbaca.
//
// Dua keputusan reka bentuk yang perlu difahami sebelum mengubah fail ini:
//
// 1. Medan yang kembali NULL dibiarkan sahaja, tidak dikosongkan. Admin
//    mungkin sudah menaip sesuatu sebelum mengimbas, dan imbasan yang tak
//    dapat membaca sesuatu bukan bukti bahawa apa yang admin taip itu salah.
// 2. Setiap medan yang DIISI ditandakan pada senarai ringkas selepas imbasan.
//    Imbasan boleh tersilap baca, jadi admin perlu tahu dengan tepat apa yang
//    berubah supaya dia boleh menyemaknya - bukan sekadar melihat borang yang
//    tiba-tiba penuh.

import { useRef, useState } from "react";
import { JENIS_TANAH_LABEL, JENIS_HAKMILIK_LABEL, STATUS_PEMILIKAN_LABEL, UNIT_KELUASAN_LABEL } from "@/lib/geran";

export type HasilImbas = {
  negeri: string | null;
  daerahMukim: string | null;
  nomborLot: string | null;
  nomborGeran: string | null;
  jenisTanah: string | null;
  jenisHakmilik: string | null;
  statusPemilikan: string | null;
  keluasan: number | null;
  unitKeluasan: string | null;
  nota: string;
};

const NAMA_MEDAN: Record<string, string> = {
  negeri: "Negeri",
  daerahMukim: "Daerah/Mukim",
  nomborLot: "No. lot",
  nomborGeran: "No. geran",
  jenisTanah: "Jenis tanah",
  jenisHakmilik: "Jenis hakmilik",
  statusPemilikan: "Status pemilikan",
  keluasan: "Keluasan",
  unitKeluasan: "Unit keluasan",
};

function papar(medan: string, nilai: unknown): string {
  if (medan === "jenisTanah") return JENIS_TANAH_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "jenisHakmilik") return JENIS_HAKMILIK_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "statusPemilikan") return STATUS_PEMILIKAN_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "unitKeluasan") return UNIT_KELUASAN_LABEL[String(nilai)] ?? String(nilai);
  return String(nilai);
}

export default function GeranScanUpload({ onIsi }: { onIsi: (hasil: HasilImbas) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "mengimbas">("idle");
  const [error, setError] = useState("");
  const [diisi, setDiisi] = useState<string[] | null>(null);
  const [kosong, setKosong] = useState<string[]>([]);
  const [nota, setNota] = useState("");

  async function handleFail(fail: File | null | undefined) {
    if (!fail) return;
    setError("");
    setDiisi(null);
    setKosong([]);
    setNota("");
    setStatus("mengimbas");

    try {
      const borang = new FormData();
      borang.append("imej", fail);
      const res = await fetch("/api/geran-admin/scan", { method: "POST", body: borang });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengimbas.");

      const hasil = data.hasil as HasilImbas;
      const adaNilai: string[] = [];
      const tiadaNilai: string[] = [];
      for (const medan of Object.keys(NAMA_MEDAN)) {
        const nilai = (hasil as unknown as Record<string, unknown>)[medan];
        if (nilai === null || nilai === undefined || nilai === "") tiadaNilai.push(NAMA_MEDAN[medan]);
        else adaNilai.push(`${NAMA_MEDAN[medan]}: ${papar(medan, nilai)}`);
      }

      onIsi(hasil);
      setDiisi(adaNilai);
      setKosong(tiadaNilai);
      setNota(hasil.nota || "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-md border border-dashed border-brand-gold/60 bg-brand-cream/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-brand-dark">Imbas geran &amp; isi borang</h3>
        <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
          Jimat menaip
        </span>
      </div>
      <p className="mt-1 text-xs text-brand-dark/55">
        Lampirkan gambar atau imbasan hakmilik. Butiran lot dibaca dan diisi ke dalam borang di bawah.
        <strong> Semak setiap medan</strong> sebelum simpan — bacaan boleh tersilap, terutamanya pada
        dokumen yang kabur atau bercop.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={status === "mengimbas"}
        onChange={(e) => handleFail(e.target.files?.[0])}
        className="mt-3 w-full rounded-sm border border-brand-dark/20 bg-white p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark disabled:opacity-60"
      />

      {status === "mengimbas" && (
        <p className="mt-2 text-xs font-semibold text-brand-dark/70">Membaca dokumen...</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {diisi && (
        <div className="mt-3 space-y-2 text-xs">
          {diisi.length > 0 ? (
            <div>
              <p className="font-semibold text-emerald-700">Diisi ({diisi.length}):</p>
              <ul className="mt-1 space-y-0.5 text-brand-dark/70">
                {diisi.map((baris) => (
                  <li key={baris}>· {baris}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="font-semibold text-red-600">
              Tiada medan dapat dibaca daripada imej ini. Cuba gambar yang lebih terang atau lebih dekat.
            </p>
          )}

          {kosong.length > 0 && (
            <p className="text-brand-dark/50">
              <span className="font-semibold">Tak dapat dibaca:</span> {kosong.join(", ")} — isi sendiri.
            </p>
          )}

          {nota && (
            <p className="rounded-sm bg-white/70 px-2.5 py-2 text-brand-dark/70">
              <span className="font-semibold">Nota bacaan:</span> {nota}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
