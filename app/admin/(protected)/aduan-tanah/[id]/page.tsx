export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/BackButton";
import StatusAduanUpdater from "@/components/aduan/StatusAduanUpdater";
import { HUBUNGAN_LABEL, KATEGORI_TANAH_LABEL, JENIS_PENCEROBOHAN_LABEL } from "@/lib/aduanTanah";

const PetaLihatLokasi = dynamicImport(() => import("@/components/aduan/PetaLihatLokasi"), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-md bg-brand-cream animate-pulse" />,
});

export default async function AdminAduanTanahDetailPage({ params }: { params: { id: string } }) {
  requireAdminOnly();
  const aduan = await prisma.landComplaint.findUnique({ where: { id: params.id } });
  if (!aduan) notFound();

  return (
    <div className="max-w-4xl">
      <BackButton href="/admin/aduan-tanah" label="Kembali ke Senarai Aduan" className="mb-4" />
      <h1 className="font-display text-2xl font-bold mb-6">Aduan #{aduan.seq}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-md shadow-sm p-5">
            <h2 className="font-semibold mb-3">Maklumat Pengadu</h2>
            {aduan.anonim ? (
              <p className="text-sm text-brand-dark/60 italic">Pengadu memilih untuk kekal anonim.</p>
            ) : (
              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">Nama</dt>
                  <dd>{aduan.namaPenuh || "-"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">Telefon</dt>
                  <dd>{aduan.telefon || "-"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">E-mel</dt>
                  <dd>{aduan.emel || "-"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">Boleh dihubungi</dt>
                  <dd>{aduan.benarkanDihubungi ? "Ya" : "Tidak"}</dd>
                </div>
              </dl>
            )}
            <p className="text-sm mt-2">
              <span className="font-medium">Hubungan dengan tanah:</span>{" "}
              {HUBUNGAN_LABEL[aduan.hubungan] || aduan.hubungan}
            </p>
          </section>

          <section className="bg-white rounded-md shadow-sm p-5">
            <h2 className="font-semibold mb-3">Lokasi & Identiti Tanah</h2>
            <dl className="text-sm space-y-1 mb-4">
              <div className="flex gap-2">
                <dt className="font-medium w-40 shrink-0">Negeri</dt>
                <dd>{aduan.negeri}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium w-40 shrink-0">Daerah / Mukim</dt>
                <dd>{aduan.daerahMukim}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium w-40 shrink-0">Nombor Lot / Hakmilik</dt>
                <dd>{aduan.nomborLot || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium w-40 shrink-0">Status Kategori Tanah</dt>
                <dd>{KATEGORI_TANAH_LABEL[aduan.statusKategoriTanah] || aduan.statusKategoriTanah}</dd>
              </div>
            </dl>

            {aduan.gpsLat != null && aduan.gpsLng != null ? (
              <>
                <PetaLihatLokasi lat={aduan.gpsLat} lng={aduan.gpsLng} />
                <a
                  href={`https://www.google.com/maps?q=${aduan.gpsLat},${aduan.gpsLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-brand-gold underline"
                >
                  Buka di Google Maps ({aduan.gpsLat.toFixed(6)}, {aduan.gpsLng.toFixed(6)}) &rarr;
                </a>
              </>
            ) : (
              <p className="text-sm text-brand-dark/50">Pengadu tidak menandakan pin lokasi.</p>
            )}
          </section>

          <section className="bg-white rounded-md shadow-sm p-5">
            <h2 className="font-semibold mb-3">Butiran Isu & Pencerobohan</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {aduan.jenisPencerobohan.map((j) => (
                <span key={j} className="inline-block bg-brand-cream text-brand-dark/70 text-xs rounded-sm px-2 py-1">
                  {JENIS_PENCEROBOHAN_LABEL[j] || j}
                </span>
              ))}
            </div>
            {aduan.jenisLain && (
              <p className="text-sm mb-2">
                <span className="font-medium">Lain-lain:</span> {aduan.jenisLain}
              </p>
            )}
            {aduan.anggaranTarikhMula && (
              <p className="text-sm mb-2">
                <span className="font-medium">Anggaran tarikh mula disedari:</span>{" "}
                {aduan.anggaranTarikhMula.toLocaleDateString("ms-MY")}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap">{aduan.keteranganTerperinci}</p>
          </section>

          {(aduan.fotoUrls.length > 0 || aduan.dokumenUrls.length > 0) && (
            <section className="bg-white rounded-md shadow-sm p-5">
              <h2 className="font-semibold mb-3">Bukti Fizikal & Lampiran</h2>
              {aduan.fotoUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-brand-dark/50 mb-2">Foto Kawasan Terjejas</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {aduan.fotoUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Foto kawasan terjejas" className="rounded-sm w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {aduan.dokumenUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-dark/50 mb-2">Dokumen Sokongan</p>
                  <ul className="space-y-1">
                    {aduan.dokumenUrls.map((url, i) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-gold underline">
                          Dokumen {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section className="bg-white rounded-md shadow-sm p-5 text-xs text-brand-dark/50 space-y-1">
            <p>Pengesahan maklumat benar: {aduan.pengesahanMaklumat ? "Ya" : "Tidak"}</p>
            <p>Persetujuan PDPA: {aduan.persetujuanPdpa ? "Ya" : "Tidak"}</p>
            <p>Dihantar: {aduan.createdAt.toLocaleString("ms-MY")}</p>
          </section>
        </div>

        <div>
          <StatusAduanUpdater id={aduan.id} status={aduan.status} notaAdmin={aduan.notaAdmin} />
        </div>
      </div>
    </div>
  );
}
