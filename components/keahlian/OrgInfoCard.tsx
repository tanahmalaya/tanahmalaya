import { IconInfo } from "./icons";

type Props = {
  variant?: "dark" | "light";
};

export default function OrgInfoCard({ variant = "dark" }: Props) {
  if (variant === "light") {
    return (
      <div className="bg-white border border-black/5 border-l-4 border-l-emerald-500/70 rounded-2xl shadow-sm shadow-black/[0.03] p-5 flex items-start gap-3">
        <span className="text-brand-gold shrink-0 mt-0.5">
          <IconInfo />
        </span>
        <div className="text-sm text-brand-dark/70 space-y-1">
          <p className="text-brand-gold font-semibold mb-1.5">MAKLUMAT PERTUBUHAN</p>
          <p><span className="inline-block w-36 text-brand-dark/40">Nama Pertubuhan</span>: Pertubuhan Literasi Tanah</p>
          <p><span className="inline-block w-36 text-brand-dark/40">No. Pendaftaran</span>: PPM-001-10-17042026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-brand-gold/30 rounded-md p-5 flex items-start gap-3">
      <span className="text-brand-gold shrink-0 mt-0.5">
        <IconInfo />
      </span>
      <div className="text-sm text-white/80 space-y-1">
        <p className="text-brand-gold font-semibold mb-1.5">MAKLUMAT PERTUBUHAN</p>
        <p><span className="inline-block w-36 text-white/50">Nama Pertubuhan</span>: Pertubuhan Literasi Tanah</p>
        <p><span className="inline-block w-36 text-white/50">No. Pendaftaran</span>: PPM-001-10-17042026</p>
      </div>
    </div>
  );
}
