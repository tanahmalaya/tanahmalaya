import BackButton from "@/components/BackButton";

export default function TentangKamiPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <BackButton href="/" label="Kembali ke Utama" className="mb-4" />
      <h1 className="font-display text-3xl font-bold mb-4">Tentang Kami</h1>
      <p className="text-brand-dark/80 leading-relaxed mb-4">
        Pertubuhan Literasi Tanah (PLT) — No. Pendaftaran PPM-001-10-17042026 —
        komited untuk mendidik masyarakat Malaysia tentang hak milik, undang-undang
        tanah dan pengurusan harta secara sah dan berilmu.
      </p>
      <p className="text-brand-dark/80 leading-relaxed">
        Melalui kelas, seminar, dan program kembara ilmu, kami membantu ahli
        masyarakat memahami geran hakmilik, pusaka, hibah, dan proses pecah sempadan
        tanah supaya hak mereka terpelihara untuk generasi akan datang.
      </p>
    </section>
  );
}
