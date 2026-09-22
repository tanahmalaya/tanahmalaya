"use client";

// Tab "Gambar" dalam editor polygon admin. Admin pilih satu gambar penyenaraian,
// lukis sempadan tanah di atasnya, dan koordinatnya disimpan terhadap gambar
// PENUH - bukan terhadap kotak 16:9 yang dipapar di galeri awam. Sebab itu
// kanvas di sini mengikut nisbah asal gambar, dan kita lukis panduan putus-putus
// yang tunjukkan bahagian mana akan terpangkas di halaman butiran.

import { useMemo, useState } from "react";
import type { BentukPolygon, GambarPolygons, Titik } from "@/lib/geran/polygon";
import { bundarkanTitik } from "@/lib/geran/polygon";
import PolygonCanvas from "./PolygonCanvas";

const NISBAH_GALERI = 16 / 9;

type Dimensi = { w: number; h: number };

function PanduanPangkas({ dimensi }: { dimensi: Dimensi }) {
  const nisbah = dimensi.w / dimensi.h;
  const lebar = nisbah > NISBAH_GALERI ? NISBAH_GALERI / nisbah : 1;
  const tinggi = nisbah > NISBAH_GALERI ? 1 : nisbah / NISBAH_GALERI;
  if (lebar > 0.999 && tinggi > 0.999) return null;

  return (
    <div
      className="pointer-events-none absolute border-2 border-dashed border-white/50"
      style={{
        left: `${((1 - lebar) / 2) * 100}%`,
        top: `${((1 - tinggi) / 2) * 100}%`,
        width: `${lebar * 100}%`,
        height: `${tinggi * 100}%`,
      }}
    />
  );
}

export default function GambarPolygonEditor({
  gambarUrls,
  value,
  onChange,
}: {
  gambarUrls: string[];
  value: GambarPolygons;
  onChange: (polygons: GambarPolygons) => void;
}) {
  const [aktif, setAktif] = useState(0);
  const [dimensi, setDimensi] = useState<Record<string, Dimensi>>({});

  const url = gambarUrls[Math.min(aktif, gambarUrls.length - 1)];
  const bentuk: BentukPolygon | undefined = url ? value[url] : undefined;
  const points = useMemo(() => bentuk?.points ?? [], [bentuk]);
  const dim = url ? dimensi[url] : undefined;

  function simpanBentuk(sebahagian: Partial<BentukPolygon>) {
    if (!url) return;
    const baru = { ...value };
    const gabung: BentukPolygon = {
      points: sebahagian.points ?? points,
      label: sebahagian.label !== undefined ? sebahagian.label : bentuk?.label ?? null,
      w: dim?.w ?? bentuk?.w ?? null,
      h: dim?.h ?? bentuk?.h ?? null,
    };
    if (gabung.points.length < 3) {
      delete baru[url];
    } else {
      baru[url] = { ...gabung, points: bundarkanTitik(gabung.points) };
    }
    onChange(baru);
  }

  if (gambarUrls.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-brand-dark/20 p-4 text-xs text-brand-dark/50">
        Muat naik gambar tanah dahulu di bahagian Media, kemudian kembali ke sini untuk lukis sempadan.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {gambarUrls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setAktif(i)}
            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-sm border-2 ${
              i === aktif ? "border-brand-dark" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            {value[u]?.points?.length ? (
              <span className="absolute bottom-0 right-0 bg-[#C68A2E] px-1 text-[9px] font-bold text-white">
                ✓
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {url && (
        <>
          <PolygonCanvas
            points={points}
            onChange={(p) => simpanBentuk({ points: p })}
            aspect={dim ? `${dim.w} / ${dim.h}` : "16 / 9"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Gambar tanah"
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                setDimensi((d) =>
                  d[url] ? d : { ...d, [url]: { w: el.naturalWidth, h: el.naturalHeight } }
                );
              }}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
            {dim && <PanduanPangkas dimensi={dim} />}
          </PolygonCanvas>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-dark/70">
                Label atas polygon (pilihan)
              </label>
              <input
                value={bentuk?.label ?? ""}
                onChange={(e) => simpanBentuk({ label: e.target.value || null })}
                disabled={points.length < 3}
                placeholder="cth. Lot 4821 — 3 ekar"
                className="w-full rounded-sm border border-brand-dark/20 bg-white p-2 text-sm disabled:bg-brand-cream/50"
              />
            </div>
            <p className="self-end text-xs text-brand-dark/40">
              Kotak putus-putus = bahagian yang dipapar di galeri awam. Apa-apa di luarnya akan
              terpangkas.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
