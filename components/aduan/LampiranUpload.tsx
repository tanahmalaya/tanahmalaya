"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type Fail = { nama: string; url: string; status: "memuatnaik" | "selesai" | "gagal" };

export default function LampiranUpload({
  jenis,
  label,
  hint,
  accept,
  maxFail,
  urls,
  onChange,
}: {
  jenis: "foto" | "dokumen";
  label: string;
  hint: string;
  accept: string;
  maxFail: number;
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [fails, setFails] = useState<Fail[]>([]);
  const [ralat, setRalat] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setRalat("");
    const files = Array.from(fileList);

    if (urls.length + files.length > maxFail) {
      setRalat(`Maksimum ${maxFail} fail dibenarkan.`);
      return;
    }
    const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setRalat(`Fail "${tooBig.name}" melebihi had 10MB.`);
      return;
    }

    for (const file of files) {
      const entry: Fail = { nama: file.name, url: "", status: "memuatnaik" };
      setFails((prev) => [...prev, entry]);
      try {
        const blob = await upload(`aduan-tanah/${jenis}/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/aduan-tanah/upload",
          clientPayload: jenis,
        });
        setFails((prev) =>
          prev.map((f) => (f.nama === entry.nama && f.status === "memuatnaik" ? { ...f, url: blob.url, status: "selesai" } : f))
        );
        onChange([...urls, blob.url]);
      } catch (err) {
        setFails((prev) =>
          prev.map((f) => (f.nama === entry.nama && f.status === "memuatnaik" ? { ...f, status: "gagal" } : f))
        );
        setRalat(`Gagal memuat naik "${file.name}". Sila cuba lagi.`);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function buang(url: string) {
    onChange(urls.filter((u) => u !== url));
    setFails((prev) => prev.filter((f) => f.url !== url));
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <p className="text-xs text-brand-dark/50 mb-2">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-brand-gold file:text-brand-dark file:font-semibold file:text-xs"
      />
      {ralat && <p className="mt-1 text-xs text-red-600">{ralat}</p>}

      {fails.length > 0 && (
        <ul className="mt-2 space-y-1">
          {fails.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-xs bg-brand-cream rounded-sm px-3 py-2">
              <span className="truncate">{f.nama}</span>
              <span className="flex items-center gap-2 shrink-0 ml-2">
                {f.status === "memuatnaik" && <span className="text-brand-dark/50">Memuat naik...</span>}
                {f.status === "gagal" && <span className="text-red-600">Gagal</span>}
                {f.status === "selesai" && (
                  <>
                    <span className="text-green-700">✓</span>
                    <button type="button" onClick={() => buang(f.url)} className="text-red-600 hover:underline">
                      Buang
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
