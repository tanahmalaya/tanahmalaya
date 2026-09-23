// Data untuk Peta Lot & peta inventori dashboard LANDHUB - satu bentuk
// ringkas yang selamat dihantar ke klien (tiada BigInt, tiada harga dalaman).

import { prisma } from "@/lib/prisma";
import { bacaPenandaPeta } from "@/lib/geran/peta";
import type { Lapisan, JenisBentuk } from "@/lib/geran/penanda";
import type { StatusGeranKey } from "@/lib/geran/status";

export type StatusPeta = "AVAILABLE" | "RESERVED" | "SOLD" | "OTHER";

export type LotPeta = {
  id: string;
  noLot: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  hargaSen: number | null;
  keluasan: number | null;
  unit: string;
};

export type BentukPeta = {
  id: string;
  lapisan: Lapisan;
  bentuk: JenisBentuk;
  points: [number, number][]; // [lng, lat]
  lotId: string | null;
  label: string | null;
};

export type KameraPeta = { id: string; lat: number; lng: number; tajuk: string | null; lotId: string | null };

export type ListingPeta = {
  id: string;
  seq: number;
  tajuk: string;
  negeri: string;
  daerah: string;
  status: StatusGeranKey;
  // Status listing dipetakan ke palet lot supaya pin & poligon berkongsi
  // makna warna: tersiar = Available, ditempah = Reserved, terjual = Sold.
  statusPeta: StatusPeta;
  hargaSen: number | null;
  keluasan: number;
  unit: string;
  lat: number | null;
  lng: number | null;
  gambar: string | null;
  lots: LotPeta[];
  bentuk: BentukPeta[];
  kamera: KameraPeta[];
};

export function statusPetaListing(s: StatusGeranKey): StatusPeta {
  if (s === "PUBLISHED") return "AVAILABLE";
  if (s === "RESERVED") return "RESERVED";
  if (s === "SOLD") return "SOLD";
  return "OTHER";
}

export async function dataPetaLot(): Promise<ListingPeta[]> {
  const gerans = await prisma.geran.findMany({
    where: { status: { notIn: ["ARCHIVED", "REJECTED"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      seq: true,
      tajuk: true,
      negeri: true,
      daerahMukim: true,
      status: true,
      hargaSiaranSen: true,
      hargaDimintaSen: true,
      keluasan: true,
      unitKeluasan: true,
      latitude: true,
      longitude: true,
      gambarUrls: true,
      penandaPeta: true,
      lots: {
        orderBy: { susunan: "asc" },
        select: { id: true, noLot: true, status: true, hargaSen: true, keluasan: true, unitKeluasan: true },
      },
      panorama: {
        where: { latitude: { not: null }, longitude: { not: null } },
        orderBy: { susunan: "asc" },
        select: { id: true, latitude: true, longitude: true, tajuk: true, lotId: true },
      },
    },
  });

  return gerans.map((g) => {
    const bentuk = bacaPenandaPeta(g.penandaPeta).ciri.map((c) => ({
      id: c.id,
      lapisan: c.lapisan,
      bentuk: c.bentuk,
      points: c.points as [number, number][],
      lotId: c.lotId ?? null,
      label: c.label ?? null,
    }));
    // Tiada koordinat listing? Guna pusat bentuk peta kalau ada.
    let lat = g.latitude;
    let lng = g.longitude;
    if ((lat === null || lng === null) && bentuk.length > 0) {
      const semua = bentuk.flatMap((b) => b.points);
      lng = semua.reduce((s, p) => s + p[0], 0) / semua.length;
      lat = semua.reduce((s, p) => s + p[1], 0) / semua.length;
    }
    const harga = g.hargaSiaranSen ?? g.hargaDimintaSen;
    return {
      id: g.id,
      seq: g.seq,
      tajuk: g.tajuk,
      negeri: g.negeri,
      daerah: g.daerahMukim,
      status: g.status,
      statusPeta: statusPetaListing(g.status),
      hargaSen: harga === null ? null : Number(harga),
      keluasan: g.keluasan,
      unit: g.unitKeluasan,
      lat,
      lng,
      gambar: g.gambarUrls[0] ?? null,
      lots: g.lots.map((l) => ({
        id: l.id,
        noLot: l.noLot,
        status: l.status,
        hargaSen: l.hargaSen === null ? null : Number(l.hargaSen),
        keluasan: l.keluasan,
        unit: l.unitKeluasan,
      })),
      bentuk,
      kamera: g.panorama.map((p) => ({
        id: p.id,
        lat: p.latitude as number,
        lng: p.longitude as number,
        tajuk: p.tajuk,
        lotId: p.lotId,
      })),
    };
  });
}
