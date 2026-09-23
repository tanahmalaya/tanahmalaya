export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";

const schema = z.object({
  tajuk: z.string().min(3),
  negeri: z.string().min(2),
  daerahMukim: z.string().min(2),
  nomborLot: z.string().optional().nullable(),
  nomborGeran: z.string().optional().nullable(),
  jenisTanah: z.enum(["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL"]),
  jenisHakmilik: z.enum(["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI"]),
  // Pilihan supaya penyenaraian lama & mana-mana pemanggil sedia ada tak pecah;
  // ketiadaannya bermakna "tidak pasti", sama seperti lalai borang.
  statusPemilikan: z.enum(["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI"]).optional(),
  keluasan: z.number().positive(),
  unitKeluasan: z.enum(["SQFT", "EKAR", "HEKTAR"]),
  hargaRM: z.number().positive(), // harga yang penjual minta
  keterangan: z.string().optional().nullable(),
  // Salinan penuh geran WAJIB untuk penyenaraian pengguna - GT perlu semak
  // kaveat, gadaian & sekatan kepentingan sebelum luluskan.
  salinanGeranUrl: z.string().url("Please attach the full title copy (PDF)."),
});

export async function POST(req: NextRequest) {
  const session = getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  }

  const seller = await prisma.seller.findUnique({ where: { id: session.sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;

  // Penyenaraian masuk dengan harga yang penjual minta sahaja. Admin semak
  // harga pasaran, runding harga ambil, dan set harga siaran sebelum ia boleh
  // tersiar - lihat app/api/geran-admin/geran/update. Gambar & gambar 360°
  // dirakam GT/KJ Land sendiri, jadi borang penjual tak muat naik media.
  const geran = await prisma.geran.create({
    data: {
      sellerId: seller.id,
      namaPenjual: seller.fullName,
      telefonPenjual: seller.phone,
      emelPenjual: seller.email,
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
      hargaDimintaSen: BigInt(Math.round(data.hargaRM * 100)),
      keterangan: data.keterangan || null,
      salinanGeranUrl: data.salinanGeranUrl,
      status: "MENUNGGU_SEMAKAN",
    },
  });

  return NextResponse.json({ id: geran.id, seq: geran.seq, status: geran.status });
}
