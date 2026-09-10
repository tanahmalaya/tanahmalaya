"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function ResitUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState<"idle" | "memuatnaik" | "gagal">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Fail melebihi had 10MB.");
      return;
    }
    setStatus("memuatnaik");
    try {
      const blob = await upload(`petty-cash/resit/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/petty-cash/upload",
      });
      onChange(blob.url);
      setStatus("idle");
    } catch {
      setStatus("gagal");
      setError("Gagal memuat naik resit. Sila cuba lagi.");
    }
  }

  function buang() {
    onChange(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center justify-between text-xs bg-brand-cream rounded-sm px-3 py-2.5">
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-gold underline truncate">
            Lihat resit dimuat naik →
          </a>
          <button type="button" onClick={buang} className="text-red-600 hover:underline ml-3 shrink-0">
            Buang
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={status === "memuatnaik"}
          className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-brand-gold file:text-brand-dark file:font-semibold file:text-xs disabled:opacity-60"
        />
      )}
      {status === "memuatnaik" && <p className="mt-1 text-xs text-brand-dark/50">Memuat naik...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
