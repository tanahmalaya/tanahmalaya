export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bacaPenanda, tukarWarisan } from "@/lib/geran/penanda";
import { bacaPenandaPeta } from "@/lib/geran/peta";
import { bacaHotspot } from "@/lib/geran/panorama";
import { TOKEN_BLOB_PERIBADI } from "@/lib/geran/blob-peribadi";
import LandListingEditor from "@/components/geran/admin/editor/LandListingEditor";
import type { EditorForm, EditorMeta, LotForm, StatusLotKey } from "@/components/geran/admin/editor/types";

// Wang disimpan sebagai BigInt sen; editor kerja dalam RM sebagai rentetan.
const rm = (sen: bigint | null) => (sen === null ? "" : String(Number(sen) / 100));
const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export default async function GeranAdminEditPage({ params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({
    where: { id: params.id },
    include: {
      lots: { orderBy: { susunan: "asc" } },
      panorama: { orderBy: { susunan: "asc" } },
      // url sengaja tak dipilih - blob peribadi tak dihantar ke pelayar.
      dokumen: {
        orderBy: { susunan: "asc" },
        select: { id: true, jenis: true, nama: true, saizBait: true, mime: true, akses: true },
      },
    },
  });
  if (!geran) notFound();

  // Penyenaraian yang dilukis sebelum Lot Marker: tukar polygon lama kepada
  // penanda + lot baru (belum disimpan). Admin nampak lot tu dalam editor dan
  // ia jadi rekod sebenar bila dia tekan Save.
  const warisan =
    geran.penandaLot === null && geran.gambarPolygons !== null
      ? tukarWarisan(geran.gambarPolygons)
      : { penanda: bacaPenanda(geran.penandaLot), lotBaru: [] };

  const awal: EditorForm = {
    tajuk: geran.tajuk,
    sumber: geran.sumber,
    jenisTanah: geran.jenisTanah,
    jenisHakmilik: geran.jenisHakmilik,
    statusPemilikan: geran.statusPemilikan,
    keluasan: s(geran.keluasan),
    unitKeluasan: geran.unitKeluasan,
    nomborLot: s(geran.nomborLot),
    nomborGeran: s(geran.nomborGeran),
    keterangan: s(geran.keterangan),
    negeri: geran.negeri,
    daerahMukim: geran.daerahMukim,
    mukim: s(geran.mukim),
    alamat: s(geran.alamat),
    latitude: s(geran.latitude),
    longitude: s(geran.longitude),
    namaPenjual: geran.namaPenjual,
    telefonPenjual: geran.telefonPenjual,
    emelPenjual: geran.emelPenjual,
    hargaPasaranRM: rm(geran.hargaPasaranSen),
    hargaAmbilRM: rm(geran.hargaAmbilSen),
    hargaSiaranRM: rm(geran.hargaSiaranSen),
    catatanRundingan: s(geran.catatanRundingan),
    gambarUrls: geran.gambarUrls,
    penanda: warisan.penanda,
    penandaPeta: bacaPenandaPeta(geran.penandaPeta),
    panorama: geran.panorama.map((p) => ({
      kunci: p.id,
      id: p.id,
      url: p.url,
      tajuk: s(p.tajuk),
      latitude: s(p.latitude),
      longitude: s(p.longitude),
      lotId: s(p.lotId),
      yawAwal: p.yawAwal,
      hotspots: bacaHotspot(p.hotspots),
    })),
    dokumen: geran.dokumen.map((d) => ({
      kunci: d.id,
      id: d.id,
      jenis: d.jenis,
      nama: d.nama,
      url: "",
      saizBait: d.saizBait,
      mime: d.mime,
      akses: d.akses,
    })),
    seoTitle: s(geran.seoTitle),
    seoDescription: s(geran.seoDescription),
    status: geran.status,
    catatanAdmin: s(geran.catatanAdmin),
    lots: geran.lots.map((l): LotForm => ({
      kunci: l.id,
      id: l.id,
      noLot: l.noLot,
      status: l.status as StatusLotKey,
      keluasan: s(l.keluasan),
      unitKeluasan: l.unitKeluasan,
      tenure: s(l.tenure),
      kategori: s(l.kategori),
      hargaRM: rm(l.hargaSen),
      nomborGeran: s(l.nomborGeran),
      latitude: s(l.latitude),
      longitude: s(l.longitude),
      nota: s(l.nota),
    })).concat(
      warisan.lotBaru.map((l, i): LotForm => ({
        kunci: l.kunci,
        id: null,
        noLot: l.label || `Lot ${geran.lots.length + i + 1}`,
        status: "AVAILABLE" as StatusLotKey,
        keluasan: "",
        unitKeluasan: geran.unitKeluasan,
        tenure: geran.jenisHakmilik,
        kategori: geran.jenisTanah,
        hargaRM: l.hargaSen === null ? "" : String(l.hargaSen / 100),
        nomborGeran: "",
        latitude: "",
        longitude: "",
        nota: "",
      }))
    ),
  };

  const meta: EditorMeta = {
    id: geran.id,
    seq: geran.seq,
    hargaDimintaSen: geran.hargaDimintaSen === null ? null : Number(geran.hargaDimintaSen),
    adaSalinanGeran: geran.salinanGeranUrl !== null,
    dariPenjual: geran.sumber === "PENGGUNA",
    createdAt: geran.createdAt.toISOString(),
    updatedAt: geran.updatedAt.toISOString(),
    publishedAt: geran.publishedAt?.toISOString() ?? null,
    lotWarisan: warisan.lotBaru.length,
    storPeribadi: !!TOKEN_BLOB_PERIBADI,
  };

  // useSearchParams (?tab=) dalam editor perlukan sempadan Suspense.
  return (
    <Suspense>
      <LandListingEditor awal={awal} meta={meta} />
    </Suspense>
  );
}
