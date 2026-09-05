export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z
  .object({
    anonim: z.boolean(),
    benarkanDihubungi: z.boolean(),
    namaPenuh: z.string().trim().max(200).optional().nullable(),
    telefon: z.string().trim().max(50).optional().nullable(),
    emel: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
    hubungan: z.enum(["PEMILIK_BERDAFTAR", "JIRAN_PENDUDUK", "WAKAF_AMANAH", "WAKIL_KOMUNITI_NGO", "ORANG_AWAM"]),

    negeri: z.string().trim().min(1),
    daerahMukim: z.string().trim().min(1).max(200),
    nomborLot: z.string().trim().max(200).optional().nullable(),
    gpsLat: z.number().min(-90).max(90).optional().nullable(),
    gpsLng: z.number().min(-180).max(180).optional().nullable(),
    statusKategoriTanah: z.enum(["KERAJAAN_RIZAB", "PERSENDIRIAN", "ADAT_RIZAB_MELAYU", "TIDAK_PASTI"]),

    jenisPencerobohan: z.array(z.string()).min(1, "Sila pilih sekurang-kurangnya satu jenis pencerobohan/isu."),
    jenisLain: z.string().trim().max(500).optional().nullable(),
    anggaranTarikhMula: z.string().trim().optional().nullable().or(z.literal("")),
    keteranganTerperinci: z.string().trim().min(10).max(5000),

    fotoUrls: z.array(z.string().url()).max(5),
    dokumenUrls: z.array(z.string().url()).max(5),

    pengesahanMaklumat: z.literal(true),
    persetujuanPdpa: z.literal(true),
  })
  .refine((d) => d.anonim || d.benarkanDihubungi === false || (d.namaPenuh && d.telefon), {
    message: "Sila lengkapkan nama & no. telefon untuk dihubungi, atau pilih kekal anonim.",
    path: ["namaPenuh"],
  });

export async function POST(req: NextRequest) {
  let data;
  try {
    data = schema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors[0]?.message : "Data borang tidak sah.";
    return NextResponse.json({ error: message || "Data borang tidak sah." }, { status: 400 });
  }

  const aduan = await prisma.landComplaint.create({
    data: {
      anonim: data.anonim,
      benarkanDihubungi: data.anonim ? false : data.benarkanDihubungi,
      namaPenuh: data.anonim ? null : data.namaPenuh || null,
      telefon: data.anonim ? null : data.telefon || null,
      emel: data.anonim ? null : data.emel || null,
      hubungan: data.hubungan,

      negeri: data.negeri,
      daerahMukim: data.daerahMukim,
      nomborLot: data.nomborLot || null,
      gpsLat: data.gpsLat ?? null,
      gpsLng: data.gpsLng ?? null,
      statusKategoriTanah: data.statusKategoriTanah,

      jenisPencerobohan: data.jenisPencerobohan,
      jenisLain: data.jenisLain || null,
      anggaranTarikhMula: data.anggaranTarikhMula ? new Date(data.anggaranTarikhMula) : null,
      keteranganTerperinci: data.keteranganTerperinci,

      fotoUrls: data.fotoUrls,
      dokumenUrls: data.dokumenUrls,

      pengesahanMaklumat: data.pengesahanMaklumat,
      persetujuanPdpa: data.persetujuanPdpa,
    },
  });

  return NextResponse.json({ ok: true, seq: aduan.seq });
}
