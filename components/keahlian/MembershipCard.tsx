import Image from "next/image";

type MemberType = "PLT" | "BERSEKUTU";

const CARD_STYLE: Record<
  MemberType,
  { bg: string; ribbon: [string, string, string]; badge: string; accent: string }
> = {
  PLT: {
    bg: "linear-gradient(160deg, #241a12 0%, #17110b 55%, #0c0906 100%)",
    ribbon: ["#F3D9A4", "#C68A2E", "#8B5A2B"],
    badge: "AHLI PLT",
    accent: "#D9A94F",
  },
  BERSEKUTU: {
    bg: "linear-gradient(160deg, #232323 0%, #171717 55%, #0a0a0a 100%)",
    ribbon: ["#E7E9EC", "#9AA0A8", "#5B6067"],
    badge: "AHLI BERSEKUTU",
    accent: "#C2C6CB",
  },
};

function expiryLabel(joinedAt: string) {
  const d = new Date(joinedAt);
  d.setFullYear(d.getFullYear() + 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function MembershipCard({
  type,
  fullName,
  memberNo,
  joinedAt,
}: {
  type: MemberType;
  fullName: string;
  memberNo: string;
  joinedAt: string;
}) {
  const style = CARD_STYLE[type];
  const gradId = `ribbon-${type}`;
  const patternId = `pattern-${type}`;

  return (
    <div
      className="relative overflow-hidden rounded-xl shadow-xl aspect-[2.05/1] max-w-md mx-auto"
      style={{ background: style.bg }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 244"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.ribbon[0]} />
            <stop offset="45%" stopColor={style.ribbon[1]} />
            <stop offset="100%" stopColor={style.ribbon[2]} />
          </linearGradient>
          <pattern id={patternId} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <rect width="26" height="26" fill="none" />
            <rect x="6" y="6" width="14" height="14" fill="none" stroke={style.accent} strokeWidth="1" transform="rotate(45 13 13)" />
          </pattern>
        </defs>

        <rect x="260" y="0" width="240" height="244" fill={`url(#${patternId})`} opacity="0.16" />
        <path
          d="M 500,0 C 430,10 462,58 400,90 C 338,122 380,182 322,244 L 500,244 Z"
          fill={`url(#${gradId})`}
        />
        <path
          d="M 500,0 C 430,10 462,58 400,90 C 338,122 380,182 322,244 L 500,244 Z"
          fill={`url(#${patternId})`}
          opacity="0.22"
          style={{ mixBlendMode: "overlay" }}
        />
      </svg>

      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md overflow-hidden shrink-0">
            <Image src="/logo.png" width={36} height={36} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="w-px h-8 bg-white/15 shrink-0" aria-hidden />
          <div className="leading-tight">
            <p className="text-[10px] tracking-[0.2em] font-semibold text-white/70">PERTUBUHAN</p>
            <p className="font-display font-bold text-base sm:text-lg" style={{ color: style.accent }}>
              LITERASI TANAH
            </p>
            <p className="text-[9px] tracking-[0.2em] text-white/50 mt-0.5">MEMELIHARA TANAH NEGARA</p>
          </div>
        </div>

        <div>
          <p className="text-white font-bold text-sm sm:text-base leading-tight">{style.badge}</p>
        </div>

        <div>
          <p className="text-[9px] tracking-[0.16em] text-white/50 mb-0.5">NAMA AHLI</p>
          <p className="text-white font-semibold text-sm leading-tight truncate">{fullName}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/50 mb-0.5">NO. AHLI</p>
            <p className="font-bold text-sm tracking-wide" style={{ color: style.accent }}>
              {memberNo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.16em] text-white/50 mb-0.5">SAH SEHINGGA</p>
            <p className="font-bold text-sm tracking-wide" style={{ color: style.accent }}>
              {expiryLabel(joinedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
