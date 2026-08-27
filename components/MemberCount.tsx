import { prisma } from "@/lib/prisma";

export default async function MemberCount() {
  const jumlah = await prisma.member.count({ where: { status: "AKTIF" } });

  return (
    <div className="text-center">
      <p className="font-display text-4xl md:text-5xl font-bold text-brand-gold">
        {jumlah.toLocaleString("ms-MY")}
      </p>
      <p className="text-sm text-white/70 tracking-wide mt-1">AHLI BERDAFTAR</p>
    </div>
  );
}