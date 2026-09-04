"use client";

import { useState } from "react";

/**
 * Butang copy ringkas untuk admin (contoh: salin nama/no KP semasa semakan
 * ahli). Guna Clipboard API terus - tiada backend/state server terlibat.
 */
export default function CopyButton({
  value,
  label = "Salin",
  className = "text-brand-dark/50 hover:text-brand-dark border border-brand-dark/20 rounded-sm px-2 py-0.5 text-[10px] font-semibold",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API tak available (contoh: bukan HTTPS) - senyap sahaja.
        }
      }}
    >
      {copied ? "Disalin!" : label}
    </button>
  );
}
