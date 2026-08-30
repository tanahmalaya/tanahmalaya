import Link from "next/link";

export default function MembershipCTA() {
  return (
    <div className="bg-brand-brown text-white rounded-md p-8 flex flex-col justify-center">
      <h3 className="font-display text-xl font-bold mb-3">
        AHLI BERPENGETAHUAN, MASA DEPAN TERPELIHARA
      </h3>
      <p className="text-white/85 text-sm mb-6">
        Dengan menjadi ahli, anda akan mendapat akses kepada kelas eksklusif, bahan
        pembelajaran, konsultasi, dan banyak lagi.
      </p>
      <Link
        href="/keahlian"
        className="bg-brand-gold text-brand-dark px-5 py-3 rounded-sm font-semibold w-fit"
      >
        ISI BORANG KEAHLIAN
      </Link>
      <p className="text-white/70 text-sm mt-4">
        Sudah jadi ahli?{" "}
        <Link href="/keahlian/semak" className="text-brand-gold underline">
          Semak nombor ahli anda di sini
        </Link>
        .
      </p>
    </div>
  );
}
