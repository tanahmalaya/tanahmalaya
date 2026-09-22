export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";
import { idVideoYoutube, MAX_GAMBAR_GERAN } from "@/lib/geran";
import {
  bacaGambarPolygons,
  gambarPolygonsSchema,
  tapisPolygonGambar,
  videoPolygonTrackSchema,
} from "@/lib/geran-polygon";

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
  // Sempadan tanah yang admin lukis di skrin edit - lihat lib/geran-polygon.ts.
  gambarPolygons: gambarPolygonsSchema.optional().nullable(),
  videoPolygonTrack: videoPolygonTrackSchema.optional().nullable(),
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

  // Polygon terikat pada URL gambar, jadi bila admin buang gambar dalam simpan
  // yang sama, polygonnya kena ikut keluar - kalau tidak kolum Json ni
  // mengumpul rujukan ke blob yang dah tak wujud.
  const gambarAkhir = data.gambarUrls ?? geran.gambarUrls;

  // Medan polygon adalah pilihan dalam skema ini. Medan yang TIADA bermakna
  // "jangan sentuh" - hanya null yang eksplisit membuangnya. Tanpa beza ini,
  // mana-mana pemanggil yang menghantar sebahagian medan sahaja akan senyap-
  // senyap memadam kerja melukis sempadan yang mungkin mengambil masa berjam.
  const gambarPolygons = tapisPolygonGambar(
    data.gambarPolygons === undefined
      ? bacaGambarPolygons(geran.gambarPolygons)
      : data.gambarPolygons ?? {},
    gambarAkhir
  );

  const videoTrackLama = geran.videoPolygonTrack ?? Prisma.DbNull;
  const videoPolygonTrack =
    data.videoPolygonTrack === undefined
      ? (videoTrackLama as Prisma.InputJsonValue | typeof Prisma.DbNull)
      : data.videoPolygonTrack ?? Prisma.DbNull;

  await prisma.geran.update({
    where: { id: geran.id },
    data: {
      hargaPasaranSen: sen(data.hargaPasaranRM),
      hargaAmbilSen: sen(data.hargaAmbilRM),
      hargaSiaranSen,
      catatanRundingan: data.catatanRundingan?.trim() || null,
      gambarUrls: gambarAkhir,
      videoYoutubeUrl,
      keterangan: data.keterangan?.trim() || null,
      gambarPolygons,
      videoPolygonTrack,
    },
  });

  return NextResponse.json({ ok: true });
}
