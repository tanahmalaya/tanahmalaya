export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GeranAdminEditForm, { type GeranEditData } from "@/components/geran/GeranAdminEditForm";
import { bacaGambarPolygons, bacaVideoTrack } from "@/lib/geran-polygon";
import {
  JENIS_TANAH_LABEL,
  JENIS_HAKMILIK_LABEL,
  STATUS_GERAN_LABEL,
  SUMBER_GERAN_LABEL,
  formatKeluasan,
} from "@/lib/geran";

export default async function GeranAdminEditPage({ params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id } });
  if (!geran) notFound();

  const data: GeranEditData = {
    id: geran.id,
    seq: geran.seq,
    tajuk: geran.tajuk,
    status: geran.status,
    hargaDimintaSen: geran.hargaDimintaSen === null ? null : Number(geran.hargaDimintaSen),
    hargaPasaranSen: geran.hargaPasaranSen === null ? null : Number(geran.hargaPasaranSen),
    hargaAmbilSen: geran.hargaAmbilSen === null ? null : Number(geran.hargaAmbilSen),
    hargaSiaranSen: geran.hargaSiaranSen === null ? null : Number(geran.hargaSiaranSen),
    catatanRundingan: geran.catatanRundingan,
    keterangan: geran.keterangan,
    gambarUrls: geran.gambarUrls,
    videoYoutubeUrl: geran.videoYoutubeUrl,
    statusPemilikan: geran.statusPemilikan,
    gambarPolygons: bacaGambarPolygons(geran.gambarPolygons),
    videoPolygonTrack: bacaVideoTrack(geran.videoPolygonTrack),
  };

  return (
    <div>
      <Link href="/geran/admin/geran" className="text-xs underline text-brand-dark/50 hover:text-brand-dark">
        ‹ Kembali ke senarai
      </Link>

      <h1 className="font-display text-2xl font-bold mt-3 mb-1">
        #{geran.seq} — {geran.tajuk}
      </h1>
      <p className="text-sm text-brand-dark/55 mb-6">
        {geran.daerahMukim}, {geran.negeri} · {JENIS_TANAH_LABEL[geran.jenisTanah]} ·{" "}
        {JENIS_HAKMILIK_LABEL[geran.jenisHakmilik]} · {formatKeluasan(geran.keluasan, geran.unitKeluasan)} ·{" "}
        {SUMBER_GERAN_LABEL[geran.sumber]} · {STATUS_GERAN_LABEL[geran.status]}
      </p>

      <div className="bg-white border border-brand-dark/10 rounded-md p-5 mb-5 max-w-2xl">
        <h2 className="font-bold text-brand-dark mb-3">Hubungan penjual</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-brand-dark/60">
          <p>
            <span className="text-brand-dark/40">Nama:</span> {geran.namaPenjual}
          </p>
          <p>
            <span className="text-brand-dark/40">Telefon:</span> {geran.telefonPenjual}
          </p>
          <p className="sm:col-span-2">
            <span className="text-brand-dark/40">Emel:</span> {geran.emelPenjual}
          </p>
          {(geran.nomborLot || geran.nomborGeran) && (
            <p className="sm:col-span-2">
              <span className="text-brand-dark/40">Lot/Geran:</span> {geran.nomborLot || "-"} /{" "}
              {geran.nomborGeran || "-"}
            </p>
          )}
        </div>
        {geran.salinanGeranUrl && (
          <a
            href={`/api/geran-admin/salinan-geran/${geran.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark bg-brand-cream/70 border border-brand-dark/15 rounded-sm px-2.5 py-1.5 mt-3"
          >
            📄 Salinan penuh geran (PDF) →
          </a>
        )}
      </div>

      <GeranAdminEditForm geran={data} />
    </div>
  );
}
