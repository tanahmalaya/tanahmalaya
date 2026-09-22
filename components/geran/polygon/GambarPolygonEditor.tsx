"use client";

// Tab "Gambar" dalam editor polygon admin. Admin pilih satu gambar penyenaraian
// dan lukis SATU ATAU LEBIH lot di atasnya (tanah yang dipecah jual Lot 1,
// Lot 2, ...), masing-masing dengan label & harga sendiri. Koordinatnya
// disimpan terhadap gambar PENUH - bukan terhadap kotak 16:9 yang dipapar di
// galeri awam. Sebab itu kanvas di sini mengikut nisbah asal gambar, dan kita
// lukis panduan putus-putus yang tunjukkan bahagian mana akan terpangkas di
// halaman butiran.

import { useEffect, useState } from "react";
import type { GambarPolygons, LotPolygon, Titik } from "@/lib/geran/polygon";
import { bundarkanTitik } from "@/lib/geran/polygon";
import { formatRM } from "@/lib/geran";
import PolygonCanvas from "./PolygonCanvas";

const NISBAH_GALERI = 16 / 9;
const INPUT = "w-full rounded-sm border border-brand-dark/20 bg-white p-2 text-sm disabled:bg-brand-cream/50";

type Dimensi = { w: number; h: number };

function buatIdLot(): string {
  return `lot_${Math.random().toString(36).slice(2, 10)}`;
}

function namaLot(lot: LotPolygon, indeks: number): string {
  return lot.label?.trim() || `Lot ${indeks + 1}`;
}

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
  const [aktifGambar, setAktifGambar] = useState(0);
  const [dimensi, setDimensi] = useState<Record<string, Dimensi>>({});

  const url = gambarUrls[Math.min(aktifGambar, gambarUrls.length - 1)];
  const entri = url ? value[url] : undefined;
  const dim = url ? dimensi[url] : undefined;
  const lots = entri?.lots ?? [];

  // Lot yang sedang dipilih/disunting pada gambar aktif. null = belum ada lot
  // dipilih (draf baharu belum dilukis, atau gambar ni tiada lot lagi).
  const [aktifLotId, setAktifLotId] = useState<string | null>(lots[0]?.id ?? null);

  // Draf bucu lot aktif disimpan di sini, BUKAN terus dalam `value` induk -
  // `value` (GambarPolygons) hanya boleh pegang lot yang sudah sah (>=3 bucu),
  // lihat gambarPolygonsSchema. Kalau draf 1-2 bucu terus ditulis ke situ, ia
  // akan dipadam balik oleh penapis panjang selepas SETIAP klik semasa melukis.
  const [points, setPoints] = useState<Titik[]>(lots.find((l) => l.id === aktifLotId)?.points ?? []);

  // Tukar gambar aktif -> ikut lot pertama gambar baharu (atau kosong kalau
  // tiada lot lagi, sedia untuk terus melukis Lot 1).
  useEffect(() => {
    const lotSenarai = value[url]?.lots ?? [];
    const idPertama = lotSenarai[0]?.id ?? null;
    setAktifLotId(idPertama);
    setPoints(lotSenarai.find((l) => l.id === idPertama)?.points ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const lotAktif = lots.find((l) => l.id === aktifLotId);
  const lotLain = lots.filter((l) => l.id !== aktifLotId);

  function tulisLots(lotsBaru: LotPolygon[]) {
    if (!url) return;
    const baru = { ...value };
    if (lotsBaru.length === 0) {
      delete baru[url];
    } else {
      baru[url] = { w: dim?.w ?? entri?.w ?? null, h: dim?.h ?? entri?.h ?? null, lots: lotsBaru };
    }
    onChange(baru);
  }

  function simpanBucu(baruPoints: Titik[]) {
    setPoints(baruPoints);
    if (baruPoints.length > 0 && baruPoints.length < 3) return; // masih draf, jangan komited lagi

    if (baruPoints.length === 0) {
      if (aktifLotId) tulisLots(lots.filter((l) => l.id !== aktifLotId));
      return;
    }

    if (aktifLotId) {
      // Lot sedia ada - kemaskini bucu di tempat asal supaya susunan senarai
      // (dan nombor "Lot N" yang dipaparkan) tak melompat-lompat.
      tulisLots(lots.map((l) => (l.id === aktifLotId ? { ...l, points: bundarkanTitik(baruPoints) } : l)));
    } else {
      const id = buatIdLot();
      setAktifLotId(id);
      tulisLots([...lots, { id, points: bundarkanTitik(baruPoints), label: null, hargaSen: null }]);
    }
  }

  function kemaskiniMedan(sebahagian: Partial<Pick<LotPolygon, "label" | "hargaSen">>) {
    if (!aktifLotId || !lotAktif) return;
    tulisLots(lots.map((l) => (l.id === aktifLotId ? { ...l, ...sebahagian } : l)));
  }

  function lotBaharu() {
    setAktifLotId(null);
    setPoints([]);
  }

  function pilihLot(id: string) {
    setAktifLotId(id);
    setPoints(lots.find((l) => l.id === id)?.points ?? []);
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
            onClick={() => setAktifGambar(i)}
            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-sm border-2 ${
              i === aktifGambar ? "border-brand-dark" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            {value[u]?.lots?.length ? (
              <span className="absolute bottom-0 right-0 bg-[#C68A2E] px-1 text-[9px] font-bold text-white">
                {value[u]?.lots?.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {url && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {lots.map((lot, i) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => pilihLot(lot.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  lot.id === aktifLotId
                    ? "border-brand-dark bg-brand-dark text-white"
                    : "border-brand-dark/20 text-brand-dark/60 hover:border-brand-dark/40"
                }`}
              >
                {namaLot(lot, i)}
              </button>
            ))}
            <button
              type="button"
              onClick={lotBaharu}
              disabled={!aktifLotId && points.length === 0}
              className="rounded-full border border-dashed border-brand-dark/30 px-2.5 py-1 text-[11px] font-semibold text-brand-dark/60 hover:border-brand-dark/50 disabled:opacity-40"
            >
              + Lot baharu
            </button>
          </div>

          <PolygonCanvas
            points={points}
            onChange={simpanBucu}
            aspect={dim ? `${dim.w} / ${dim.h}` : "16 / 9"}
            latarLain={lotLain.map((l) => ({ id: l.id, points: l.points }))}
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

          <p className="mt-1.5 text-xs text-brand-dark/40">
            {aktifLotId
              ? `Sunting ${namaLot(lotAktif ?? { id: "", points: [] }, lots.findIndex((l) => l.id === aktifLotId))}`
              : "Melukis lot baharu"}
            {lotLain.length > 0 ? ` · ${lotLain.length} lot lain dipapar redup untuk rujukan.` : ""}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-dark/70">
                No. lot / label (pilihan)
              </label>
              <input
                value={lotAktif?.label ?? ""}
                onChange={(e) => kemaskiniMedan({ label: e.target.value || null })}
                disabled={!lotAktif}
                placeholder="cth. Lot 4821 — 3 ekar"
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-dark/70">
                Harga lot ini (RM, pilihan)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={lotAktif?.hargaSen ? lotAktif.hargaSen / 100 : ""}
                onChange={(e) => {
                  const rm = Number(e.target.value);
                  kemaskiniMedan({ hargaSen: e.target.value && rm > 0 ? Math.round(rm * 100) : null });
                }}
                disabled={!lotAktif}
                placeholder="cth. 198000"
                className={INPUT}
              />
              {lotAktif?.hargaSen ? (
                <p className="mt-1 text-xs text-brand-dark/40">{formatRM(lotAktif.hargaSen)}</p>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-brand-dark/40">
            Kotak putus-putus = bahagian yang dipapar di galeri awam. Apa-apa di luarnya akan terpangkas.
            Label & harga dipapar terus atas gambar di halaman awam.
          </p>
        </>
      )}
    </div>
  );
}
