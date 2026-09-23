// Data Lot Marker LANDHUB - bentuk yang admin lukis atas gambar aerial/drone
// penyenaraian: sempadan lot (poligon), jalan & sungai (garisan) dan label
// (titik). Disimpan dalam Geran.penandaLot, dikunci ikut URL gambar.
//
// Koordinat TERNORMAL 0..1 relatif kepada gambar penuh (sama seperti
// lib/geran/polygon.ts), jadi bentuk kekal tepat pada semua saiz paparan.
// Poligon lapisan "lot" dipaut ke rekod Lot melalui lotId - label, harga &
// warna status di halaman awam datang dari rekod Lot itu, bukan disalin ke sini.

import { z } from "zod";
import { bacaGambarPolygons, type Titik } from "./polygon";

export type Lapisan = "lot" | "jalan" | "sungai" | "label";
export type JenisBentuk = "titik" | "garis" | "poligon";

export type Ciri = {
  id: string;
  lapisan: Lapisan;
  bentuk: JenisBentuk;
  points: Titik[];
  // Hanya untuk lapisan "lot". Dalam editor ia boleh jadi kunci sementara lot
  // yang belum disimpan; pelayan tukar kepada id sebenar semasa simpan.
  lotId?: string | null;
  label?: string | null;
};

export type PenandaGambar = {
  w: number; // dimensi asal gambar - perlu untuk overlay "cover" di galeri awam
  h: number;
  ciri: Ciri[];
};

export type Penanda = Record<string, PenandaGambar>;

export const LAPISAN: Record<Lapisan, { label: string; bentuk: JenisBentuk[] }> = {
  lot: { label: "Lot", bentuk: ["poligon"] },
  jalan: { label: "Road", bentuk: ["garis"] },
  sungai: { label: "River", bentuk: ["garis"] },
  label: { label: "Label", bentuk: ["titik"] },
};

export const MAX_CIRI_SETIAP_GAMBAR = 150;
export const MAX_TITIK_CIRI = 200;

const titikSchema = z.tuple([z.number().min(-0.5).max(1.5), z.number().min(-0.5).max(1.5)]);

const ciriSchema = z
  .object({
    id: z.string().min(1).max(60),
    lapisan: z.enum(["lot", "jalan", "sungai", "label"]),
    bentuk: z.enum(["titik", "garis", "poligon"]),
    points: z.array(titikSchema).min(1).max(MAX_TITIK_CIRI),
    lotId: z.string().max(60).nullish(),
    label: z.string().max(120).nullish(),
  })
  .refine(
    (c) =>
      (c.bentuk === "titik" && c.points.length === 1) ||
      (c.bentuk === "garis" && c.points.length >= 2) ||
      (c.bentuk === "poligon" && c.points.length >= 3),
    { message: "Shape has too few points" }
  );

const penandaGambarSchema = z.object({
  w: z.number().positive().max(40000),
  h: z.number().positive().max(40000),
  ciri: z.array(ciriSchema).max(MAX_CIRI_SETIAP_GAMBAR),
});

export const penandaSchema = z.record(z.string().url(), penandaGambarSchema);

// Baca dari kolum Json - buang apa-apa yang tak sah supaya halaman awam tak
// pecah kerana satu entri rosak.
export function bacaPenanda(nilai: unknown): Penanda {
  if (!nilai || typeof nilai !== "object") return {};
  const keluar: Penanda = {};
  for (const [url, mentah] of Object.entries(nilai as Record<string, unknown>)) {
    const hasil = penandaGambarSchema.safeParse(mentah);
    if (hasil.success) keluar[url] = hasil.data;
  }
  return keluar;
}

export type LotWarisan = { kunci: string; label: string | null; hargaSen: number | null };

// Tukar polygon format lama (Geran.gambarPolygons - label & harga terus pada
// polygon) kepada penanda + senarai lot yang perlu dicipta. Dipanggil sekali
// semasa editor dibuka untuk penyenaraian yang belum ada penandaLot, supaya
// kerja melukis lama tak hilang dan harga lot lama jadi rekod Lot sebenar.
export function tukarWarisan(gambarPolygons: unknown): { penanda: Penanda; lotBaru: LotWarisan[] } {
  const lama = bacaGambarPolygons(gambarPolygons);
  const penanda: Penanda = {};
  const lotBaru: LotWarisan[] = [];
  for (const [url, entri] of Object.entries(lama)) {
    if (!entri.w || !entri.h) continue;
    penanda[url] = {
      w: entri.w,
      h: entri.h,
      ciri: entri.lots.map((l) => {
        const kunci = `warisan-${l.id}`;
        lotBaru.push({ kunci, label: l.label ?? null, hargaSen: l.hargaSen ?? null });
        return { id: `c-${l.id}`, lapisan: "lot" as const, bentuk: "poligon" as const, points: l.points, lotId: kunci };
      }),
    };
  }
  return { penanda, lotBaru };
}

// Buang entri gambar yang dah dipadam dari penyenaraian, dan pautan ke lot
// yang tiada lagi (lot dipadam) - bentuknya kekal, cuma jadi tak berpaut.
export function tapisPenanda(penanda: Penanda, gambarUrls: string[], lotIdSah: Set<string>): Penanda {
  const dibenarkan = new Set(gambarUrls);
  const keluar: Penanda = {};
  for (const [url, entri] of Object.entries(penanda)) {
    if (!dibenarkan.has(url) || entri.ciri.length === 0) continue;
    keluar[url] = {
      ...entri,
      ciri: entri.ciri.map((c) => (c.lotId && !lotIdSah.has(c.lotId) ? { ...c, lotId: null } : c)),
    };
  }
  return keluar;
}

// ---------- Geometri (dalam ruang piksel gambar) ----------
// Pengiraan dibuat dalam piksel, bukan koordinat ternormal: gambar jarang
// segi empat sama, jadi luas & pusat dalam ruang 0..1 akan herot.

export type Pt = [number, number];

export function luasPoligon(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

// Pusat jisim poligon - untuk letak label lot. Jatuh balik ke purata bucu bila
// luasnya hampir sifar (poligon merosot).
export function pusatPoligon(p: Pt[]): Pt {
  const a = luasPoligon(p);
  if (Math.abs(a) < 1e-9) {
    return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    const f = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function silangGaris(a: Pt, b: Pt, c: Pt, d: Pt): { t: number; u: number; pt: Pt } | null {
  // Persilangan garis AB (tak terhingga, parameter t) dengan segmen CD (u).
  const r: Pt = [b[0] - a[0], b[1] - a[1]];
  const s: Pt = [d[0] - c[0], d[1] - c[1]];
  const penyebut = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(penyebut) < 1e-12) return null;
  const qp: Pt = [c[0] - a[0], c[1] - a[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / penyebut;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / penyebut;
  if (u < 0 || u >= 1) return null;
  return { t, u, pt: [a[0] + t * r[0], a[1] + t * r[1]] };
}

// Belah poligon dengan garisan lurus melalui A & B. Garisan mesti melintasi
// poligon tepat dua kali (poligon cembung, atau potongan yang bersih) -
// selain itu pulangkan null dan editor minta admin lukis semula.
export function belahPoligon(p: Pt[], a: Pt, b: Pt): [Pt[], Pt[]] | null {
  const silang: Array<{ i: number; pt: Pt; t: number }> = [];
  for (let i = 0; i < p.length; i += 1) {
    const s = silangGaris(a, b, p[i], p[(i + 1) % p.length]);
    if (s) silang.push({ i, pt: s.pt, t: s.t });
  }
  if (silang.length !== 2) return null;
  const [s1, s2] = silang[0].i <= silang[1].i ? [silang[0], silang[1]] : [silang[1], silang[0]];

  const kiri: Pt[] = [s1.pt];
  for (let i = s1.i + 1; i <= s2.i; i += 1) kiri.push(p[i]);
  kiri.push(s2.pt);

  const kanan: Pt[] = [s2.pt];
  for (let i = s2.i + 1; i < p.length; i += 1) kanan.push(p[i]);
  for (let i = 0; i <= s1.i; i += 1) kanan.push(p[i]);
  kanan.push(s1.pt);

  if (Math.abs(luasPoligon(kiri)) < 1 || Math.abs(luasPoligon(kanan)) < 1) return null;
  return [kiri, kanan];
}

// Buang bucu yang terletak atas garis lurus antara jirannya - tinggalan
// garisan potong selepas lot yang dibelah digabung semula. Toleransi dalam
// piksel gambar (luas segi tiga bucu dengan jirannya).
export function buangSegaris(p: Pt[], toleransi = 0.5): Pt[] {
  if (p.length <= 3) return p;
  const keluar = p.filter((b, i) => {
    const a = p[(i - 1 + p.length) % p.length];
    const c = p[(i + 1) % p.length];
    const luas = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
    const panjang = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
    return luas / panjang > toleransi;
  });
  return keluar.length >= 3 ? keluar : p;
}

// ---------- Paparan awam ----------

export type CiriAwam = {
  id: string;
  lapisan: Lapisan;
  bentuk: JenisBentuk;
  points: Titik[];
  label: string | null;
  warna: string;
};

export type PenandaAwam = Record<string, { w: number; h: number; ciri: CiriAwam[] }>;

type LotAwam = { id: string; noLot: string; status: "AVAILABLE" | "RESERVED" | "SOLD"; hargaSen: bigint | number | null };

// Warna sama dengan Lot Marker admin (components/geran/admin/editor/lotShared).
const WARNA_STATUS_LOT = { AVAILABLE: "#10B981", RESERVED: "#F59E0B", SOLD: "#EF4444" } as const;
export const WARNA_LAPISAN = { jalan: "#FBBF24", sungai: "#38BDF8", label: "#FFFFFF", lotTakBerpaut: "#F4C55C" } as const;

// Sediakan bentuk untuk halaman awam: label & warna lot datang dari rekod Lot
// semasa (bukan disalin ke penanda), jadi tukar status ke Sold dalam editor
// terus menukar warna di laman awam. Harga tak dipapar untuk lot Sold.
export function penandaAwam(
  geran: { penandaLot: unknown; gambarPolygons: unknown },
  lots: LotAwam[],
  formatRM: (sen: number) => string
): PenandaAwam {
  const lotIkutId = new Map(lots.map((l) => [l.id, l]));
  const keluar: PenandaAwam = {};

  // Penyenaraian lama yang belum dibuka dalam Lot Marker - papar polygon
  // lama dengan label & harga asalnya.
  if (geran.penandaLot === null || geran.penandaLot === undefined) {
    for (const [url, entri] of Object.entries(bacaGambarPolygons(geran.gambarPolygons))) {
      if (!entri.w || !entri.h) continue;
      keluar[url] = {
        w: entri.w,
        h: entri.h,
        ciri: entri.lots.map((l) => ({
          id: l.id,
          lapisan: "lot" as const,
          bentuk: "poligon" as const,
          points: l.points,
          label: [l.label?.trim() || null, l.hargaSen ? formatRM(l.hargaSen) : null].filter(Boolean).join(" — ") || null,
          warna: WARNA_LAPISAN.lotTakBerpaut,
        })),
      };
    }
    return keluar;
  }

  for (const [url, entri] of Object.entries(bacaPenanda(geran.penandaLot))) {
    keluar[url] = {
      w: entri.w,
      h: entri.h,
      ciri: entri.ciri.map((c) => {
        if (c.lapisan === "lot") {
          const lot = c.lotId ? lotIkutId.get(c.lotId) : undefined;
          const harga = lot && lot.status !== "SOLD" && lot.hargaSen ? formatRM(Number(lot.hargaSen)) : null;
          const label = lot ? [lot.noLot, lot.status === "SOLD" ? "Sold" : lot.status === "RESERVED" ? "Reserved" : harga].filter(Boolean).join(" — ") : null;
          return {
            id: c.id,
            lapisan: c.lapisan,
            bentuk: c.bentuk,
            points: c.points,
            label,
            warna: lot ? WARNA_STATUS_LOT[lot.status] : WARNA_LAPISAN.lotTakBerpaut,
          };
        }
        return {
          id: c.id,
          lapisan: c.lapisan,
          bentuk: c.bentuk,
          points: c.points,
          label: c.label ?? null,
          warna: WARNA_LAPISAN[c.lapisan],
        };
      }),
    };
  }
  return keluar;
}
