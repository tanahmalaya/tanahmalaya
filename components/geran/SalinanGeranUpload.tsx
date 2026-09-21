"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const MAX_SAIZ = 15 * 1024 * 1024;

// Salinan penuh geran dalam bentuk PDF - satu fail sahaja, dimuat naik
// sebagai blob PERIBADI (lihat komen pada Geran.salinanGeranUrl). URL yang
// dipulangkan tak boleh dibuka terus; admin baca melalui laluan proksi
// app/api/geran-admin/salinan-geran/[id] yang semak sesi admin dulu.
export default function SalinanGeranUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState<"idle" | "memuatnaik">("idle");
  const [error, setError] = useState("");
  const [namaFail, setNamaFail] = useState("");
  // Pratonton tempatan dari fail yang baru dipilih - blob peribadi tak boleh
  // dibuka terus, jadi pautan ini hidup dalam sesi pelayar ini sahaja.
  const [pratontonUrl, setPratontonUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pratontonUrl) URL.revokeObjectURL(pratontonUrl);
    };
  }, [pratontonUrl]);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");

    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_SAIZ) {
      setError("File exceeds the 15MB limit.");
      return;
    }

    setStatus("memuatnaik");
    try {
      const blob = await upload(`geran/salinan/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/geran/upload",
      });
      setNamaFail(file.name);
      setPratontonUrl((lama) => {
        if (lama) URL.revokeObjectURL(lama);
        return URL.createObjectURL(file);
      });
      onChange(blob.url);
    } catch {
      setError("Failed to upload the PDF. Please try again.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function buang() {
    setNamaFail("");
    setPratontonUrl((lama) => {
      if (lama) URL.revokeObjectURL(lama);
      return null;
    });
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 border border-black/10 rounded-xl p-3">
        <span className="text-lg leading-none">📄</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{namaFail || "Title copy (PDF)"}</p>
          {pratontonUrl ? (
            <a
              href={pratontonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline text-[#0E3B2E]/60"
            >
              Preview
            </a>
          ) : (
            <p className="text-xs text-[#0E3B2E]/45">Attached</p>
          )}
        </div>
        <button type="button" onClick={buang} className="text-xs font-semibold text-red-600 shrink-0">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        disabled={status === "memuatnaik"}
        className="w-full text-sm border border-brand-dark/20 rounded-xl p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-brand-gold file:text-brand-dark file:font-semibold file:text-xs disabled:opacity-60"
      />
      {status === "memuatnaik" && <p className="mt-1 text-xs text-brand-dark/50">Uploading...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
