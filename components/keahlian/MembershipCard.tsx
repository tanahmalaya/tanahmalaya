import Image from "next/image";

type MemberType = "PLT" | "BERSEKUTU";

const CARD_STYLE: Record<MemberType, { gradient: string; label: string; text: string; sub: string }> = {
  PLT: {
    gradient: "linear-gradient(135deg, #E8C27A 0%, #C68A2E 55%, #8B5A2B 100%)",
    label: "AHLI PLT",
    text: "text-brand-dark",
    sub: "text-brand-dark/60",
  },
  BERSEKUTU: {
    gradient: "linear-gradient(135deg, #4A4A4A 0%, #2A2A2A 55%, #0F0F0F 100%)",
    label: "AHLI BERSEKUTU",
    text: "text-white",
    sub: "text-white/60",
  },
};

export default function MembershipCard({
  type,
  fullName,
  memberNo,
}: {
  type: MemberType;
  fullName: string;
  memberNo: string;
}) {
  const style = CARD_STYLE[type];

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 shadow-lg aspect-[1.586/1] max-w-sm mx-auto"
      style={{ background: style.gradient }}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" aria-hidden />
      <div className="absolute -right-2 -bottom-16 w-32 h-32 rounded-full bg-white/10 pointer-events-none" aria-hidden />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-white/90">
              <Image src="/logo.png" width={36} height={36} alt="" className="w-full h-full object-cover" />
            </div>
            <div className={`leading-tight ${style.text}`}>
              <p className="text-[10px] tracking-widest font-semibold opacity-80">PERTUBUHAN</p>
              <p className="text-xs font-bold">LITERASI TANAH</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full bg-black/10 ${style.text}`}
          >
            {style.label}
          </span>
        </div>

        <div>
          <p className={`text-[10px] tracking-widest ${style.sub} mb-0.5`}>NAMA AHLI</p>
          <p className={`font-display font-bold text-lg leading-tight ${style.text}`}>{fullName}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className={`text-[10px] tracking-widest ${style.sub} mb-0.5`}>NO. AHLI</p>
            <p className={`font-bold text-base tracking-wide ${style.text}`}>{memberNo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
