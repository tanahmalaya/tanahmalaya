// Lencana status penyenaraian untuk LANDHUB. Warna ikut maksud workflow:
// kuning = perlu tindakan admin, biru = sedang diproses, hijau = tersiar,
// merah = ditolak. Dikongsi dashboard, senarai tanah & editor.

export const STATUS_LANDHUB: Record<string, { label: string; badge: string; dot: string; hex: string }> = {
  MENUNGGU_SEMAKAN: {
    label: "Pending Review",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    hex: "#F59E0B",
  },
  DALAM_RUNDINGAN: {
    label: "Under Review",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    hex: "#0EA5E9",
  },
  DISAHKAN: {
    label: "Active",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    hex: "#10B981",
  },
  DITOLAK: {
    label: "Rejected",
    badge: "bg-red-50 text-red-600 ring-red-200",
    dot: "bg-red-500",
    hex: "#EF4444",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LANDHUB[status] ?? { label: status, badge: "bg-black/5 text-black/60 ring-black/10", dot: "bg-black/40" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
