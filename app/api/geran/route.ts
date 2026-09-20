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
  keluasan: z.number().positive(),
  unitKeluasan: z.enum(["SQFT", "EKAR", "HEKTAR"]),
  hargaRM: z.number().positive(),
  keterangan: z.string().optional().nullable(),
  gambarUrls: z.array(z.string().url()).max(5).optional(),
  mintaDroneSurvey: z.boolean().optional(),
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
  const mintaDrone = data.mintaDroneSurvey ?? false;

  // PLT-registered REN seller: listing goes straight to DISAHKAN
  // (auto-approve), with the REN themselves as assignedRen. Regular sellers
  // stay at MENUNGGU_SEMAKAN - admin must pick a PLT-assigned REN on
  // approval (see app/api/geran-admin/geran/update-status).
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
      keluasan: data.keluasan,
      unitKeluasan: data.unitKeluasan,
      hargaSen: BigInt(Math.round(data.hargaRM * 100)),
      keterangan: data.keterangan || null,
      gambarUrls: data.gambarUrls ?? [],
      mintaDroneSurvey: mintaDrone,
      statusDroneSurvey: mintaDrone ? "MENUNGGU_PILOT" : "TIDAK_BERKAITAN",
      status: seller.renDisahkan ? "DISAHKAN" : "MENUNGGU_SEMAKAN",
      assignedRenId: seller.renDisahkan ? seller.id : null,
    },
  });

  return NextResponse.json({ id: geran.id, seq: geran.seq, status: geran.status });
}
