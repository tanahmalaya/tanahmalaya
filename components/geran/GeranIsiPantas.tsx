"use client";

// "Isi pantas" di atas borang tambah penyenaraian: lampirkan screenshot iklan
// tanah dari kumpulan WhatsApp/Telegram, dan medan borang diisi daripadanya.
//
// OCR berjalan sepenuhnya dalam pelayar (tesseract.js) - tiada fail dihantar
// ke mana-mana, tiada kunci API, kos RM0.
//
// Teks hasil OCR dipapar dan BOLEH DISUNTING sebelum dihurai. Ini bukan
// hiasan: WhatsApp dan Telegram memampat gambar, jadi satu aksara boleh
// tersalah baca ("Sekar" untuk "5 ekar"). Tanpa langkah ini, satu ralat kecil
// bermakna admin terpaksa menaip semula seluruh borang; dengannya, dia
// membetulkan satu huruf dan tekan hurai semula. Kotak itu juga menerima teks
// yang ditampal terus bila iklan datang sebagai teks, bukan gambar.

import { useRef, useState } from "react";
import { JENIS_TANAH_LABEL, JENIS_HAKMILIK_LABEL, STATUS_PEMILIKAN_LABEL, UNIT_KELUASAN_LABEL, formatRM } from "@/lib/geran";
import { huraiIklanTanah, type HasilHurai } from "@/lib/geran/parse";

const NAMA_MEDAN: Record<string, string> = {
  negeri: "State",
  daerahMukim: "District",
  nomborLot: "Lot no.",
  jenisTanah: "Category",
  jenisHakmilik: "Tenure",
  statusPemilikan: "Ownership",
  keluasan: "Size",
  unitKeluasan: "Unit",
  hargaRM: "Price",
};

function papar(medan: string, nilai: unknown): string {
  if (medan === "jenisTanah") return JENIS_TANAH_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "jenisHakmilik") return JENIS_HAKMILIK_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "statusPemilikan") return STATUS_PEMILIKAN_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "unitKeluasan") return UNIT_KELUASAN_LABEL[String(nilai)] ?? String(nilai);
  if (medan === "hargaRM") return formatRM(Number(nilai) * 100);
  return String(nilai);
}

export default function GeranIsiPantas({ onIsi }: { onIsi: (hasil: HasilHurai) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [teks, setTeks] = useState("");
  const [peringkat, setPeringkat] = useState("");
  const [progres, setProgres] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState("");
  const [diisi, setDiisi] = useState<string[] | null>(null);
  const [kosong, setKosong] = useState<string[]>([]);
  const [nota, setNota] = useState<string[]>([]);

  async function bacaImej(fail: File | null | undefined) {
    if (!fail) return;
    setError("");
    setDiisi(null);
    setSibuk(true);
    setProgres(0);
    setPeringkat("Loading the OCR engine (first time only)...");

    try {
      // Import dinamik: tesseract.js besar, dan majoriti lawatan ke skrin ini
      // tak menggunakannya langsung. Ia hanya dimuat turun bila betul-betul
      // diperlukan, kemudian di-cache oleh pelayar.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setPeringkat("Reading text...");
            setProgres(m.progress);
          }
        },
      });
      const hasil = await worker.recognize(fail);
      await worker.terminate();

      const dibaca = (hasil.data.text || "").trim();
      setTeks(dibaca);
      if (!dibaca) {
        setError("No text could be read from this image. Try a larger or sharper screenshot.");
      } else {
        huraiDanIsi(dibaca);
      }
    } catch {
      setError("The OCR engine failed to load. Check your connection, or paste the ad text below.");
    } finally {
      setSibuk(false);
      setPeringkat("");
      setProgres(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function huraiDanIsi(sumber: string) {
    const hasil = huraiIklanTanah(sumber);
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
    setNota(hasil.nota);
    setError("");
  }

  return (
    <div className="rounded-xl border border-dashed border-emerald-600/40 bg-emerald-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold">Quick fill from an ad</h3>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Free · runs in your browser
        </span>
      </div>
      <p className="mt-1 text-xs text-black/55">
        Attach a screenshot of a land ad from WhatsApp or Telegram — the text is read in your browser and
        the form is filled in. You can also paste the ad text into the box below.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={sibuk}
        onChange={(e) => bacaImej(e.target.files?.[0])}
        className="mt-3 w-full rounded-lg border border-black/[0.12] bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:opacity-60"
      />

      {sibuk && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-black/60">{peringkat}</p>
          {progres > 0 && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${progres * 100}%` }} />
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold text-black/60">
          Ad text {teks ? "(fix any misread text, then parse again)" : "(or paste it here)"}
        </label>
        <textarea
          rows={5}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder={"e.g.\nTanah pertanian 3 ekar\nMukim Hulu Langat, Selangor\nGeran kekal, rizab melayu\nRM450,000"}
          className="w-full rounded-lg border border-black/[0.12] bg-white p-2 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => huraiDanIsi(teks)}
          disabled={!teks.trim() || sibuk}
          className="mt-2 rounded-lg bg-[#0B2A1F] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Parse &amp; fill form
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {diisi && (
        <div className="mt-3 space-y-2 text-xs">
          {diisi.length > 0 ? (
            <div>
              <p className="font-semibold text-emerald-700">Filled ({diisi.length}):</p>
              <ul className="mt-1 space-y-0.5 text-black/65">
                {diisi.map((baris) => (
                  <li key={baris}>· {baris}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="font-semibold text-red-600">
              No land details recognised in this text. Check the text above, or fill in the form yourself.
            </p>
          )}

          {kosong.length > 0 && (
            <p className="text-black/50">
              <span className="font-semibold">Not found:</span> {kosong.join(", ")} — fill in yourself.
            </p>
          )}

          {nota.map((n) => (
            <p key={n} className="rounded-lg bg-amber-50 px-2.5 py-2 text-amber-800">
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
