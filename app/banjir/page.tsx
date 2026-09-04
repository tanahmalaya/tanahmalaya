import dynamic from "next/dynamic";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Semak Kawasan Banjir",
  description:
    "Cari alamat atau guna lokasi GPS anda untuk semak sama ada kawasan rumah/tanah yang bakal dibeli berhampiran kawasan banjir, berdasarkan data rasmi JKM & JPS.",
  alternates: { canonical: "/banjir" },
};

const PetaBanjir = dynamic(() => import("@/components/banjir/PetaBanjir"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-md bg-brand-cream animate-pulse flex items-center justify-center text-brand-dark/50 text-sm">
      Memuatkan peta...
    </div>
  ),
});

export default function BanjirPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-3xl font-bold mb-2">Semak Kawasan Banjir</h1>
      <p className="text-brand-dark/70 mb-8 max-w-2xl">
        Bakal beli rumah atau tanah? Cari alamat kawasan tersebut atau tekan{" "}
        <strong>Guna Lokasi Saya</strong> untuk semak sama ada kawasan itu tersenarai
        sebagai hotspot banjir dikenali (Selangor &amp; WP KL), berhampiran stesen paras
        air yang kerap tinggi, atau lokasi PPS banjir — berdasarkan data rasmi PLANMalaysia,
        Jabatan Kebajikan Masyarakat (JKM) dan Jabatan Pengairan dan Saliran (JPS).
      </p>

      <PetaBanjir />

      <p className="mt-8 text-xs text-brand-dark/50 max-w-2xl">
        Nota: Senarai hotspot banjir hanya meliputi Selangor &amp; WP Kuala Lumpur, dan
        diambil daripada sumber PLANMalaysia yang tidak rasmi (mungkin berhenti berfungsi
        pada bila-bila masa). Lapisan lain (stesen paras air &amp; PPS) mencerminkan keadaan
        <strong> semasa/terkini</strong> sahaja. Kesemuanya <strong>bukan</strong> pengesahan
        rasmi sempadan kawasan mudah banjir, kerana tiada dataset sempadan banjir polygon
        yang terbuka kepada awam secara rasmi setakat ini. Untuk pengesahan rasmi sebelum
        membeli hartanah, sila rujuk Pihak Berkuasa Tempatan (PBT) berkenaan atau portal rasmi{" "}
        <a
          href="https://publicinfobanjir.water.gov.my/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-gold"
        >
          Public InfoBanjir (JPS)
        </a>{" "}
        atau{" "}
        <a
          href="https://portalbencana.nadma.gov.my/ms/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-gold"
        >
          Portal Bencana NADMA
        </a>
        .
      </p>
    </section>
  );
}
