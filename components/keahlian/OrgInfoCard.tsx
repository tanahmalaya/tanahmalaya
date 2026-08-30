import { IconInfo } from "./icons";

export default function OrgInfoCard() {
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
