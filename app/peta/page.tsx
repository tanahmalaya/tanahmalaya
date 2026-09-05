import BackButton from "@/components/BackButton";
import PetaTabs from "@/components/peta/PetaTabs";

export const metadata = {
  title: "Peta Banjir & Tanah Wakaf",
  description:
    "Semak kawasan banjir berhampiran alamat/lokasi anda atau lihat lokasi tanah wakaf ikut negeri, berdasarkan data rasmi JKM, JPS dan MyGeoportal (JUPEM).",
  alternates: { canonical: "/peta" },
};

export default function PetaPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
        Peta Banjir & Tanah Wakaf
      </h1>
      <p className="text-brand-dark/60 mb-6 sm:mb-8 max-w-2xl text-[15px] sm:text-base leading-relaxed">
        Bakal beli rumah atau tanah? Semak kawasan banjir berhampiran lokasi tersebut, atau lihat
        lokasi tanah wakaf ikut negeri — pilih tab di bawah.
      </p>

      <PetaTabs />

      <p className="mt-8 text-xs text-brand-dark/45 max-w-2xl leading-relaxed">
        Nota (Banjir): Senarai hotspot banjir hanya meliputi Selangor &amp; WP Kuala Lumpur, dan
        diambil daripada sumber PLANMalaysia yang tidak rasmi (mungkin berhenti berfungsi pada
        bila-bila masa). Lapisan lain (stesen paras air &amp; PPS) mencerminkan keadaan
        <strong> semasa/terkini</strong> sahaja. Kesemuanya <strong>bukan</strong> pengesahan rasmi
        sempadan kawasan mudah banjir. Untuk pengesahan rasmi sebelum membeli hartanah, sila rujuk
        Pihak Berkuasa Tempatan (PBT) berkenaan atau portal rasmi{" "}
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
        <br />
        <br />
        Nota (Tanah Wakaf): Titik lokasi diambil daripada servis GIS awam MyGeoportal (JUPEM).
        Tiada dataset sempadan lot (polygon) tanah wakaf yang terbuka kepada awam setakat ini —
        sempadan sebenar hanya ada dalam data cadastral rasmi Pejabat Tanah dan Galian (PTG) yang
        perlu dipohon secara rasmi.
      </p>
    </section>
  );
}
