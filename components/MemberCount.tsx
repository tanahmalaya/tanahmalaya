import { prisma } from "@/lib/prisma";

export default async function MemberCount() {
  const jumlah = await prisma.member.count({ where: { status: "AKTIF" } });

  return (
    <div className="flex items-center gap-3">
      <p className="font-display text-3xl md:text-4xl font-bold text-brand-gold">
        {jumlah.toLocaleString("ms-MY")}+
      </p>
      <div className="text-xs leading-tight">
        <p className="tracking-wide font-semibold text-white/80">AHLI BERDAFTAR</p>
        <p className="flex items-center gap-1.5 mt-1 text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          Komuniti yang semakin berkembang
        </p>
      </div>
    </div>
  );
}
