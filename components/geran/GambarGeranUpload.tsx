"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const MAX_GAMBAR = 5;

export default function GambarGeranUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [status, setStatus] = useState<"idle" | "memuatnaik">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    const baki = MAX_GAMBAR - value.length;
    const senarai = Array.from(files).slice(0, baki);
    if (senarai.length === 0) {
      setError(`Had maksimum ${MAX_GAMBAR} gambar.`);
      return;
    }

    setStatus("memuatnaik");
    try {
      const urlBaru: string[] = [];
      for (const file of senarai) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" melebihi had 10MB, dilangkau.`);
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const blob = await upload(`geran/gambar/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/geran/upload",
        });
        urlBaru.push(blob.url);
      }
      onChange([...value, ...urlBaru]);
    } catch {
      setError("Gagal memuat naik gambar. Sila cuba lagi.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function buang(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {value.map((url) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-black/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Gambar tanah" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => buang(url)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none active:bg-black/80"
                aria-label="Buang gambar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_GAMBAR && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={status === "memuatnaik"}
          className="w-full text-sm border border-brand-dark/20 rounded-xl p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-brand-gold file:text-brand-dark file:font-semibold file:text-xs disabled:opacity-60"
        />
      )}
      {status === "memuatnaik" && <p className="mt-1 text-xs text-brand-dark/50">Memuat naik...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-brand-dark/40">Maksimum {MAX_GAMBAR} gambar (pilihan, tidak wajib).</p>
    </div>
  );
}
