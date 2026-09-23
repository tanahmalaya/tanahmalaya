export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";

// "Add Land" dalam LANDHUB - cipta penyenaraian GT / KJ Land sebagai DRAFT
// dengan maklumat asas sahaja, kemudian admin lengkapkan (harga, lot, media,
// SEO) dalam Land Listing Editor dan tekan Publish dari sana. Penyenaraian
// pengguna pula masuk melalui app/api/geran POST sebagai SUBMITTED.
const schema = z.object({
  sumber: z.enum(["GT", "KJ_LAND"]),
  tajuk: z.string().trim().min(3, "Enter a land name").max(160),
  negeri: z.string().trim().min(1, "Choose a state"),
  daerahMukim: z.string().trim().min(1, "Enter a district"),
  nomborLot: z.string().trim().max(80).optional().nullable(),
  jenisTanah: z.enum(["KOSONG", "PERTANIAN", "PEMBANGUNAN", "PERUMAHAN", "PERINDUSTRIAN", "KOMERSIAL"]),
  jenisHakmilik: z.enum(["FREEHOLD", "LEASEHOLD", "TIDAK_PASTI"]).optional(),
  statusPemilikan: z.enum(["RIZAB_MELAYU", "LOT_BUMI", "LOT_NON_BUMI", "TIDAK_PASTI"]).optional(),
  keluasan: z.number().positive("Enter the land size"),
  unitKeluasan: z.enum(["SQFT", "EKAR", "HEKTAR"]),
  // Harga dari iklan masuk ke harga ambil (dalaman), bukan harga siaran -
  // harga awam mesti ditetapkan admin dengan sengaja dalam editor.
  hargaAmbilRM: z.number().positive().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const geran = await prisma.geran.create({
    data: {
      sumber: data.sumber,
      sellerId: null,
      // Hubungan pejabat - boleh diubah dalam tab General editor.
      namaPenjual: data.sumber === "GT" ? "GT Office" : "KJ Land Consultant",
      telefonPenjual: "",
      emelPenjual: "",
      tajuk: data.tajuk,
      negeri: data.negeri,
      daerahMukim: data.daerahMukim,
      nomborLot: data.nomborLot || null,
      jenisTanah: data.jenisTanah,
      jenisHakmilik: data.jenisHakmilik ?? "TIDAK_PASTI",
      statusPemilikan: data.statusPemilikan ?? "TIDAK_PASTI",
      keluasan: data.keluasan,
      unitKeluasan: data.unitKeluasan,
      hargaAmbilSen: data.hargaAmbilRM ? BigInt(Math.round(data.hargaAmbilRM * 100)) : null,
      gambarUrls: [],
      status: "DRAFT",
    },
  });

  return NextResponse.json({ id: geran.id, seq: geran.seq });
}
