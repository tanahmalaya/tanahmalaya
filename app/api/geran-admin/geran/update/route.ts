export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";
import { idVideoYoutube, MAX_GAMBAR_GERAN } from "@/lib/geran";

// Kemas kini penyenaraian sedia ada: harga sepanjang rundingan, nota
// rundingan, dan media yang PLT/KJ Land rakam sendiri. Dulu admin cuma boleh
// luluskan atau tolak - tiada cara langsung untuk sunting apa yang penjual
// hantar.
const ringgit = z.number().positive().optional().nullable();

const schema = z.object({
  geranId: z.string().min(1),
  hargaPasaranRM: ringgit,
  hargaAmbilRM: ringgit,
  hargaSiaranRM: ringgit,
  catatanRundingan: z.string().max(5000).optional().nullable(),
  gambarUrls: z.array(z.string().url()).max(MAX_GAMBAR_GERAN).optional(),
  videoYoutubeUrl: z.string().optional().nullable(),
  keterangan: z.string().max(5000).optional().nullable(),
});

const sen = (rm: number | null | undefined) => (rm ? BigInt(Math.round(rm * 100)) : null);

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tak sah" }, { status: 400 });
  }

  const data = parsed.data;

  const geran = await prisma.geran.findUnique({ where: { id: data.geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Penyenaraian tak dijumpai" }, { status: 404 });
  }

  // Pautan video disimpan hanya kalau ia betul-betul YouTube - halaman butiran
  // membenamkannya, jadi pautan lain cuma akan jadi embed kosong.
  let videoYoutubeUrl: string | null = null;
  if (data.videoYoutubeUrl && data.videoYoutubeUrl.trim()) {
    const id = idVideoYoutube(data.videoYoutubeUrl.trim());
    if (!id) {
      return NextResponse.json(
        { error: "Pautan video mesti pautan YouTube yang sah (youtube.com atau youtu.be)." },
        { status: 400 }
      );
    }
    videoYoutubeUrl = data.videoYoutubeUrl.trim();
  }

  // Penyenaraian yang sudah tersiar tak boleh kehilangan harga siarannya -
  // halaman awam bergantung padanya.
  const hargaSiaranSen = sen(data.hargaSiaranRM);
  if (geran.status === "DISAHKAN" && !hargaSiaranSen) {
    return NextResponse.json(
      { error: "Penyenaraian yang tersiar mesti ada harga siaran." },
      { status: 400 }
    );
  }

  await prisma.geran.update({
    where: { id: geran.id },
    data: {
      hargaPasaranSen: sen(data.hargaPasaranRM),
      hargaAmbilSen: sen(data.hargaAmbilRM),
      hargaSiaranSen,
      catatanRundingan: data.catatanRundingan?.trim() || null,
      gambarUrls: data.gambarUrls ?? geran.gambarUrls,
      videoYoutubeUrl,
      keterangan: data.keterangan?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
