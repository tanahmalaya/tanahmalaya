export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { MAX_GAMBAR_GERAN } from "@/lib/geran";
import { penandaSchema, tapisPenanda, type Penanda } from "@/lib/geran/penanda";
import { STATUS_GERAN, capMasaStatus, semakPeralihan } from "@/lib/geran/status";

// Simpan Land Listing Editor LANDHUB. Editor sentiasa hantar KESELURUHAN
// keadaan borang (semua tab) dalam satu permintaan - satu butang Save, satu
// transaksi, jadi tiada keadaan separuh tersimpan bila admin bertukar tab.

const ringgit = z.number().nonnegative().nullable();
const teks = (max: number) => z.string().trim().max(max).nullable();
const koordinat = (min: number, max: number) => z.number().min(min).max(max).nullable();

const JENIS_TANAH = ["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL"] as const;
const HAKMILIK = ["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI"] as const;
const UNIT = ["SQFT", "EKAR", "HEKTAR"] as const;

const lotSchema = z.object({
  // id sedia ada, atau tiada untuk lot baru yang ditambah dalam sesi ini.
  id: z.string().min(1).optional(),
  // Kunci editor - penanda merujuk lot melalui kunci ini, termasuk lot baru
  // yang belum ada id. Pelayan tukar kepada id sebenar sebelum simpan.
  kunci: z.string().min(1).max(60),
  noLot: z.string().trim().min(1, "Every lot needs a lot number").max(80),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
  keluasan: z.number().positive().nullable(),
  unitKeluasan: z.enum(UNIT),
  tenure: z.enum(HAKMILIK).nullable(),
  kategori: z.enum(JENIS_TANAH).nullable(),
  hargaRM: ringgit,
  nomborGeran: teks(80),
  latitude: koordinat(-90, 90),
  longitude: koordinat(-180, 180),
  nota: teks(2000),
});

const schema = z.object({
  geranId: z.string().min(1),

  // General
  tajuk: z.string().trim().min(3, "Land name is too short").max(160),
  sumber: z.enum(["GT", "KJ_LAND", "PENGGUNA"]),
  jenisTanah: z.enum(JENIS_TANAH),
  jenisHakmilik: z.enum(HAKMILIK),
  statusPemilikan: z.enum(["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI"]),
  keluasan: z.number().positive("Enter the land size"),
  unitKeluasan: z.enum(UNIT),
  nomborLot: teks(80),
  nomborGeran: teks(80),
  keterangan: teks(5000),

  // Location
  negeri: z.string().trim().min(1, "Choose a state"),
  daerahMukim: z.string().trim().min(1, "Enter a district"),
  mukim: teks(120),
  alamat: teks(300),
  latitude: koordinat(-90, 90),
  longitude: koordinat(-180, 180),

  // Contact (hubungan penjual / pejabat)
  namaPenjual: z.string().trim().min(1, "Enter a contact name").max(120),
  telefonPenjual: z.string().trim().max(40),
  emelPenjual: z.string().trim().max(160),

  // Pricing - hanya hargaSiaran sampai ke awam
  hargaPasaranRM: ringgit,
  hargaAmbilRM: ringgit,
  hargaSiaranRM: ringgit,
  catatanRundingan: teks(5000),

  // Media
  gambarUrls: z.array(z.string().url()).max(MAX_GAMBAR_GERAN),
  penanda: penandaSchema,

  // SEO
  seoTitle: teks(70),
  seoDescription: teks(170),

  // Workflow
  status: z.enum(STATUS_GERAN),
  catatanAdmin: teks(2000),

  lots: z.array(lotSchema).max(200),
});

const sen = (rm: number | null) => (rm ? BigInt(Math.round(rm * 100)) : null);
const kosongJadiNull = (s: string | null) => (s && s.length > 0 ? s : null);

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const isu = parsed.error.issues[0];
    return NextResponse.json({ error: isu ? `${isu.message} (${isu.path.join(".")})` : "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;

  const geran = await prisma.geran.findUnique({
    where: { id: d.geranId },
    select: { id: true, publishedAt: true, soldAt: true, lots: { select: { id: true } } },
  });
  if (!geran) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const hargaSiaranSen = sen(d.hargaSiaranRM);
  const catatanAdmin = kosongJadiNull(d.catatanAdmin);
  const ralatStatus = semakPeralihan(d.status, { hargaSiaranSen, catatanAdmin });
  if (ralatStatus) {
    return NextResponse.json({ error: ralatStatus }, { status: 400 });
  }

  // Lot yang dihantar dengan id mesti memang milik penyenaraian ini - jangan
  // biar permintaan yang diubah suai menyunting lot penyenaraian lain.
  const idSedia = new Set(geran.lots.map((l) => l.id));
  const asing = d.lots.find((l) => l.id && !idSedia.has(l.id));
  if (asing) {
    return NextResponse.json({ error: "A lot does not belong to this listing." }, { status: 400 });
  }
  const idDikekal = new Set(d.lots.filter((l) => l.id).map((l) => l.id!));
  const idDibuang = [...idSedia].filter((id) => !idDikekal.has(id));

  const dataLot = (l: (typeof d.lots)[number], susunan: number) => ({
    noLot: l.noLot,
    status: l.status,
    keluasan: l.keluasan,
    unitKeluasan: l.unitKeluasan,
    tenure: l.tenure,
    kategori: l.kategori,
    hargaSen: sen(l.hargaRM),
    nomborGeran: kosongJadiNull(l.nomborGeran),
    latitude: l.latitude,
    longitude: l.longitude,
    nota: kosongJadiNull(l.nota),
    susunan,
  });

  // Transaksi interaktif: lot baru mesti dicipta DULU untuk dapat id sebelum
  // penanda (yang merujuk lot) boleh ditulis.
  const lotIds = await prisma.$transaction(async (tx) => {
    await tx.lot.deleteMany({ where: { geranId: geran.id, id: { in: idDibuang } } });

    const kunciKeId = new Map<string, string>();
    const ids: string[] = [];
    for (const [i, l] of d.lots.entries()) {
      const rekod = l.id
        ? await tx.lot.update({ where: { id: l.id }, data: dataLot(l, i), select: { id: true } })
        : await tx.lot.create({ data: { geranId: geran.id, ...dataLot(l, i) }, select: { id: true } });
      kunciKeId.set(l.kunci, rekod.id);
      ids.push(rekod.id);
    }

    const penandaDisimpan: Penanda = {};
    for (const [url, entri] of Object.entries(d.penanda)) {
      penandaDisimpan[url] = {
        ...entri,
        ciri: entri.ciri.map((c) => ({ ...c, lotId: c.lotId ? kunciKeId.get(c.lotId) ?? null : null })),
      };
    }

    await tx.geran.update({
      where: { id: geran.id },
      data: {
        tajuk: d.tajuk,
        sumber: d.sumber,
        jenisTanah: d.jenisTanah,
        jenisHakmilik: d.jenisHakmilik,
        statusPemilikan: d.statusPemilikan,
        keluasan: d.keluasan,
        unitKeluasan: d.unitKeluasan,
        nomborLot: kosongJadiNull(d.nomborLot),
        nomborGeran: kosongJadiNull(d.nomborGeran),
        keterangan: kosongJadiNull(d.keterangan),

        negeri: d.negeri,
        daerahMukim: d.daerahMukim,
        mukim: kosongJadiNull(d.mukim),
        alamat: kosongJadiNull(d.alamat),
        latitude: d.latitude,
        longitude: d.longitude,

        namaPenjual: d.namaPenjual,
        telefonPenjual: d.telefonPenjual,
        emelPenjual: d.emelPenjual,

        hargaPasaranSen: sen(d.hargaPasaranRM),
        hargaAmbilSen: sen(d.hargaAmbilRM),
        hargaSiaranSen,
        catatanRundingan: kosongJadiNull(d.catatanRundingan),

        gambarUrls: d.gambarUrls,
        // Bentuk terikat pada URL gambar - buang yang gambarnya dah dipadam.
        penandaLot: tapisPenanda(penandaDisimpan, d.gambarUrls, new Set(ids)),
        // Data polygon format lama kini hidup dalam penandaLot + rekod Lot.
        gambarPolygons: Prisma.DbNull,

        seoTitle: kosongJadiNull(d.seoTitle),
        seoDescription: kosongJadiNull(d.seoDescription),

        status: d.status,
        catatanAdmin,
        ...capMasaStatus(d.status, geran),
      },
    });

    return ids;
  }, { timeout: 20_000 });

  // Pulangkan id lot ikut susunan supaya editor boleh tukar lot "baru" kepada
  // rekod sebenar - tanpa ini, simpan kali kedua akan cipta lot yang sama lagi.
  return NextResponse.json({ ok: true, lotIds });
}
