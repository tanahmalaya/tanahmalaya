"use client";

// Input harga RM yang faham singkatan ("233k", "2.5jt") dan papar pemisah
// koma bila fokus tertanggal - dua masalah biasa pada input type="number"
// biasa: admin kena taip semua sifar sendiri, dan sukar kesan lebih/kurang
// sifar pada nombor panjang.
//
// `value`/`onChange` kekal angka RM PENUH sebagai rentetan (cth "233000"),
// sama macam yang borang sedia ada dah simpan - komponen ni cuma tukar cara
// admin TAIP, bukan bentuk data yang disimpan.

import { useEffect, useState, type InputHTMLAttributes } from "react";
import { huraiRinggit } from "@/lib/geran";

function formatPaparan(value: string): string {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-MY", { maximumFractionDigits: 2 }) : value;
}

export default function HargaInput({
  value,
  onChange,
  className = "",
  placeholder = "cth. 233k atau 233000",
  previewClassName = "mt-1 text-xs text-brand-dark/40",
  ...props
}: {
  value: string;
  onChange: (rm: string) => void;
  className?: string;
  placeholder?: string;
  // Warna teks pratonton "= RM ..." - lalai ikut tema admin (brand-dark).
  // Borang bertema GERAN (hijau) hantar warna sendiri supaya kekal konsisten.
  previewClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "placeholder">) {
  const [teks, setTeks] = useState(() => formatPaparan(value));
  const [fokus, setFokus] = useState(false);

  // Ikut `value` induk (dengan koma) bila TAK sedang fokus - kalau tidak,
  // susunan semula (cth borang reset) tak nampak. Bergantung juga pada
  // `fokus` sendiri supaya bila fokus tertanggal, paparan terus diformat
  // semula dari `value` - JANGAN letak setTeks(...) terus dalam tamatFokus,
  // sebab useEffect ni akan jalan lepas tu dan tulis ganti balik dengan
  // `value` mentah (tiada koma), buat pemisah koma nampak tak berfungsi.
  useEffect(() => {
    if (!fokus) setTeks(formatPaparan(value));
  }, [value, fokus]);

  function tamatFokus() {
    setFokus(false);
    const rm = huraiRinggit(teks);
    const rentetan = rm === null ? "" : String(rm);
    if (rentetan !== value) onChange(rentetan);
  }

  const pratonton = fokus ? huraiRinggit(teks) : null;

  return (
    <div>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={teks}
        onFocus={() => setFokus(true)}
        onChange={(e) => setTeks(e.target.value)}
        onBlur={tamatFokus}
        placeholder={placeholder}
        className={className}
      />
      {pratonton !== null && (
        <p className={previewClassName}>= RM {pratonton.toLocaleString("en-MY", { maximumFractionDigits: 2 })}</p>
      )}
    </div>
  );
}
