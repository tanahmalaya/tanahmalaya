export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";

// Penyenaraian stok GT sendiri & dari KJ Land consultant - dimasukkan terus
// oleh admin di /geran/admin/tambah, jadi tiada akaun Seller dan tak perlu
// melalui semakan (terus DISAHKAN). Penyenaraian pengguna pula masuk melalui
// app/api/geran POST dan bermula di MENUNGGU_SEMAKAN.
const schema = z.object({
  sumber: z.enum(["PLT", "KJ_LAND"]),
  namaPenjual: z.string().min(2),
  telefonPenjual: z.string().min(6),
  emelPenjual: z.string().email(),
  tajuk: z.string().min(3),
  negeri: z.string().min(2),
  daerahMukim: z.string().min(2),
  nomborLot: z.string().optional().nullable(),
  nomborGeran: z.string().optional().nullable(),
  jenisTanah: z.enum(["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL"]),
  jenisHakmilik: z.enum(["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI"]),
  statusPemilikan: z.enum(["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI"]).optional(),
  keluasan: z.number().positive(),
  unitKeluasan: z.enum(["SQFT", "EKAR", "HEKTAR"]),
  hargaAmbilRM: z.number().positive().optional().nullable(), // kos GT/KJ Land
  hargaSiaranRM: z.number().positive(), // harga di direktori awam
  keterangan: z.string().optional().nullable(),
  gambarUrls: z.array(z.string().url()).max(8).optional(),
  // Pilihan di sini - GT/KJ Land dah sahkan tanah sendiri sebelum masuk.
  salinanGeranUrl: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;

  const geran = await prisma.geran.create({
    data: {
      sumber: data.sumber,
      sellerId: null,
      namaPenjual: data.namaPenjual,
      telefonPenjual: data.telefonPenjual,
      emelPenjual: data.emelPenjual,
      tajuk: data.tajuk,
      negeri: data.negeri,
      daerahMukim: data.daerahMukim,
      nomborLot: data.nomborLot || null,
      nomborGeran: data.nomborGeran || null,
      jenisTanah: data.jenisTanah,
      jenisHakmilik: data.jenisHakmilik,
      statusPemilikan: data.statusPemilikan ?? "TIDAK_PASTI",
      keluasan: data.keluasan,
      unitKeluasan: data.unitKeluasan,
      hargaAmbilSen: data.hargaAmbilRM ? BigInt(Math.round(data.hargaAmbilRM * 100)) : null,
      hargaSiaranSen: BigInt(Math.round(data.hargaSiaranRM * 100)),
      keterangan: data.keterangan || null,
      gambarUrls: data.gambarUrls ?? [],
      salinanGeranUrl: data.salinanGeranUrl || null,
      status: "DISAHKAN",
    },
  });

  return NextResponse.json({ id: geran.id, seq: geran.seq });
}
