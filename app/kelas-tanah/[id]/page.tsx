export const revalidate = 60;

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgramRegistrationForm from "@/components/ProgramRegistrationForm";
import BackButton from "@/components/BackButton";

const jenisLabel: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Bersemuka (Offline)",
  HYBRID: "Hybrid (Online & Bersemuka)",
};

function formatRM(sen: number) {
  return sen === 0 ? "PERCUMA" : `RM${(sen / 100).toFixed(2)}`;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const kelas = await prisma.landClass.findUnique({ where: { id: params.id } });
  if (!kelas) return { title: "Kelas Tidak Dijumpai" };

  return {
    title: kelas.namaKelas,
    description: `${kelas.namaKelas} — ${kelas.topik}. Lokasi: ${kelas.lokasi}. Anjuran Pertubuhan Literasi Tanah.`,
    alternates: { canonical: `/kelas-tanah/${kelas.id}` },
  };
}

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const kelas = await prisma.landClass.findUnique({
    where: { id: params.id },
    include: { registrations: { where: { status: "BERJAYA" } } },
  });
  if (!kelas) return notFound();

  const seatBaki = kelas.maxPeserta ? kelas.maxPeserta - kelas.registrations.length : null;
  const penuh = kelas.status === "PENUH" || (seatBaki !== null && seatBaki <= 0);

  return (
    <section className="max-w-3xl mx-auto px-6 py-8 md:py-16">
      <BackButton href="/kelas-tanah" label="Kembali ke Program & Kelas" className="mb-6" />
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">{kelas.namaKelas}</h1>
          <p className="text-brand-gold font-semibold mb-4">{formatRM(kelas.yuranSen)}</p>

          <div className="space-y-2 text-sm text-brand-dark/80 bg-white p-5 rounded-md shadow-sm">
            <p><strong>Topik:</strong> {kelas.topik}</p>
            <p><strong>Jenis:</strong> {jenisLabel[kelas.jenisKelas]}</p>
            <p><strong>Lokasi:</strong> {kelas.lokasi}</p>
            {kelas.jadual && <p><strong>Jadual:</strong> {kelas.jadual}</p>}
            <p><strong>Tarikh Mula:</strong> {kelas.tarikh.toLocaleDateString("ms-MY")}</p>
            {kelas.maxPeserta && (
              <p>
                <strong>Tempat:</strong> {seatBaki !== null && seatBaki > 0 ? `${seatBaki} lagi tempat` : "Penuh"}{" "}
                (had {kelas.maxPeserta} peserta)
              </p>
            )}
            {kelas.picName && (
              <p>
                <strong>Hubungi:</strong> {kelas.picName}
                {kelas.picContact ? ` — ${kelas.picContact}` : ""}
              </p>
            )}
          </div>
        </div>

        <div>
          {penuh ? (
            <div className="bg-white p-5 rounded-md shadow-sm text-center text-brand-dark/60">
              Kelas ini sudah penuh/tamat pendaftaran.
            </div>
          ) : (
            <ProgramRegistrationForm classId={kelas.id} namaKelas={kelas.namaKelas} yuranSen={kelas.yuranSen} />
          )}
        </div>
      </div>
    </section>
  );
}
