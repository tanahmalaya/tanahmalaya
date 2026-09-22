"use client";

// Permukaan lukisan polygon yang dikongsi editor gambar dan editor video.
// Ia TAK tahu apa yang ada di belakangnya - media dihantar sebagai children dan
// diletak mengisi bekas, jadi komponen yang sama berfungsi atas <img> mahupun
// <canvas> bingkai video.
//
// Semua koordinat yang keluar-masuk komponen ini ternormal 0..1 (lihat
// lib/geran-polygon.ts). Pemegang bucu dilukis sebagai <div> berperatusan, bukan
// dalam SVG, supaya ia kekal bulat walaupun bekasnya bukan segi empat sama.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Titik } from "@/lib/geran-polygon";
import { MAX_TITIK_POLYGON, titikKeSvg } from "@/lib/geran-polygon";

// Jarak (pecahan lebar bekas) untuk mengira klik sebagai "atas bucu pertama",
// iaitu isyarat biasa untuk menutup polygon.
const JARAK_TUTUP = 0.025;

export type ModPolygon = "lukis" | "sunting";

export default function PolygonCanvas({
  points,
  onChange,
  children,
  aspect = "16 / 9",
  disabled = false,
  petunjuk,
}: {
  points: Titik[];
  onChange: (points: Titik[]) => void;
  children: React.ReactNode;
  aspect?: string;
  disabled?: boolean;
  petunjuk?: React.ReactNode;
}) {
  const bekasRef = useRef<HTMLDivElement>(null);
  const [mod, setMod] = useState<ModPolygon>(points.length >= 3 ? "sunting" : "lukis");
  const [seret, setSeret] = useState<number | null>(null);
  const [kursor, setKursor] = useState<Titik | null>(null);

  // Bila polygon diganti dari luar (admin tukar gambar, auto-jejak berjalan),
  // mod kena ikut sama - kalau tidak admin nampak polygon tapi masih dalam mod
  // lukis dan kliknya menambah bucu ke-hujung entah di mana.
  useEffect(() => {
    setMod(points.length >= 3 ? "sunting" : "lukis");
  }, [points.length]);

  const kePeratus = useCallback((e: { clientX: number; clientY: number }): Titik | null => {
    const kotak = bekasRef.current?.getBoundingClientRect();
    if (!kotak || kotak.width === 0 || kotak.height === 0) return null;
    return [(e.clientX - kotak.left) / kotak.width, (e.clientY - kotak.top) / kotak.height];
  }, []);

  function hadTitik(t: Titik): Titik {
    // Bucu dibenarkan keluar sedikit dari bingkai supaya sempadan tanah yang
    // terpotong di tepi gambar masih boleh dilukis dengan sudut yang betul.
    return [Math.min(1.5, Math.max(-0.5, t[0])), Math.min(1.5, Math.max(-0.5, t[1]))];
  }

  function handleKlik(e: React.MouseEvent) {
    if (disabled || mod !== "lukis") return;
    const t = kePeratus(e);
    if (!t) return;

    if (points.length >= 3) {
      const pertama = points[0];
      if (Math.hypot(t[0] - pertama[0], t[1] - pertama[1]) < JARAK_TUTUP) {
        setMod("sunting");
        setKursor(null);
        return;
      }
    }
    if (points.length >= MAX_TITIK_POLYGON) return;
    onChange([...points, hadTitik(t)]);
  }

  function mulaSeret(e: React.PointerEvent, indeks: number) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSeret(indeks);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const t = kePeratus(e);
    if (!t) return;
    if (seret !== null) {
      const baru = [...points];
      baru[seret] = hadTitik(t);
      onChange(baru);
    } else if (mod === "lukis" && points.length > 0) {
      setKursor(t);
    }
  }

  function tamatSeret() {
    setSeret(null);
  }

  function buangBucu(indeks: number) {
    if (disabled) return;
    // Di bawah tiga bucu ia bukan polygon lagi - biarkan admin kembali ke mod
    // lukis dan mula semula daripada meninggalkan bentuk yang tak sah.
    const baru = points.filter((_, i) => i !== indeks);
    onChange(baru.length >= 3 ? baru : []);
  }

  function sisipBucu(indeks: number) {
    if (disabled || points.length >= MAX_TITIK_POLYGON) return;
    const a = points[indeks];
    const b = points[(indeks + 1) % points.length];
    const tengah: Titik = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const baru = [...points];
    baru.splice(indeks + 1, 0, tengah);
    onChange(baru);
  }

  useEffect(() => {
    if (disabled) return undefined;
    function handleKey(e: KeyboardEvent) {
      if (!bekasRef.current?.matches(":hover")) return;
      if (e.key === "Escape") {
        setKursor(null);
        setMod(points.length >= 3 ? "sunting" : "lukis");
      } else if (e.key === "Enter" && mod === "lukis" && points.length >= 3) {
        setMod("sunting");
        setKursor(null);
      } else if ((e.key === "Backspace" || e.key === "Delete") && mod === "lukis" && points.length > 0) {
        e.preventDefault();
        onChange(points.slice(0, -1));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [disabled, mod, points, onChange]);

  const tertutup = mod === "sunting" && points.length >= 3;
  const garisan: Titik[] = mod === "lukis" && kursor ? [...points, kursor] : points;

  return (
    <div>
      <div
        ref={bekasRef}
        onClick={handleKlik}
        onPointerMove={handlePointerMove}
        onPointerUp={tamatSeret}
        onPointerCancel={tamatSeret}
        onPointerLeave={() => setKursor(null)}
        className={`relative w-full overflow-hidden rounded-md bg-black select-none ${
          disabled ? "" : mod === "lukis" ? "cursor-crosshair" : "cursor-default"
        }`}
        style={{ aspectRatio: aspect, touchAction: "none" }}
      >
        {children}

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          {garisan.length >= 2 && (
            <polyline
              points={titikKeSvg(tertutup ? [...points, points[0]] : garisan)}
              fill="none"
              stroke="#F4C55C"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeDasharray={tertutup ? undefined : "4 3"}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {tertutup && (
            <polygon points={titikKeSvg(points)} fill="rgba(198, 138, 46, 0.2)" stroke="none" />
          )}
        </svg>

        {/* Pemegang tengah tepi - seret untuk tambah bucu baharu di situ. */}
        {!disabled &&
          tertutup &&
          points.map((a, i) => {
            const b = points[(i + 1) % points.length];
            return (
              <button
                key={`tepi-${i}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sisipBucu(i);
                }}
                title="Tambah bucu di sini"
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/25 hover:bg-white/80"
                style={{ left: `${((a[0] + b[0]) / 2) * 100}%`, top: `${((a[1] + b[1]) / 2) * 100}%` }}
              />
            );
          })}

        {!disabled &&
          points.map((p, i) => (
            <button
              key={`bucu-${i}`}
              type="button"
              onPointerDown={(e) => mulaSeret(e, i)}
              onClick={(e) => {
                e.stopPropagation();
                if (mod === "lukis" && i === 0 && points.length >= 3) setMod("sunting");
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                buangBucu(i);
              }}
              title={tertutup ? "Seret untuk alih · klik dua kali untuk buang" : "Klik untuk tutup polygon"}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2A1D14] shadow ${
                seret === i ? "bg-white scale-125" : "bg-[#F4C55C]"
              } ${mod === "lukis" && i === 0 ? "ring-2 ring-white/80" : ""}`}
              style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
            />
          ))}
      </div>

      {!disabled && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {mod === "lukis" ? (
            <>
              <span className="text-xs text-brand-dark/55">
                Klik pada gambar untuk letak bucu sempadan
                {points.length >= 3 ? " · klik bucu pertama untuk tutup" : ""}.
              </span>
              {points.length >= 3 && (
                <button
                  type="button"
                  onClick={() => setMod("sunting")}
                  className="rounded-sm bg-brand-dark px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  TUTUP POLYGON
                </button>
              )}
              {points.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange(points.slice(0, -1))}
                  className="rounded-sm border border-brand-dark/20 px-2.5 py-1 text-[11px] font-semibold text-brand-dark/70"
                >
                  UNDUR BUCU
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-xs text-brand-dark/55">
                {points.length} bucu · seret untuk alih, klik bulatan kecil untuk tambah, klik dua kali untuk buang.
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-sm border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600"
              >
                PADAM POLYGON
              </button>
            </>
          )}
          {petunjuk}
        </div>
      )}
    </div>
  );
}
