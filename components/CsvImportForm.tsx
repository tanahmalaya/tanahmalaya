"use client";

import { useState } from "react";

export default function CsvImportForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    try {
      const res = await fetch("/api/admin/members/import-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import gagal");
      setResult(data);
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-md shadow-sm p-6 mb-8">
      <h2 className="font-semibold mb-2">Import Pukal Ahli Sedia Ada (CSV)</h2>
      <p className="text-sm text-brand-dark/60 mb-4">
        Fail CSV perlu ada lajur: <code>fullName, icNumber, phone, email</code> (dan
        <code> memberNo</code> pilihan — kosongkan untuk jana automatik). Sediakan dari
        Excel/Google Sheets, kemudian &quot;Save As&quot; / &quot;Download&quot; sebagai CSV.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
        <input type="file" name="file" accept=".csv" required className="text-sm" />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-5 py-2 disabled:opacity-50"
        >
          {status === "loading" ? "Sedang Import..." : "IMPORT CSV"}
        </button>
      </form>

      {status === "done" && result && (
        <div className="mt-4 text-sm bg-brand-cream rounded-sm p-4">
          <p className="font-semibold text-green-700">
            Berjaya import {result.imported} ahli. {result.skipped > 0 && `${result.skipped} baris dilangkau.`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-red-600 text-xs list-disc list-inside space-y-1">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm text-red-600">Import gagal. Semak format fail CSV Tuan.</p>
      )}
    </div>
  );
}
