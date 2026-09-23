import { STATUS_INFO, isStatusGeran } from "@/lib/geran/status";

// Lencana status penyenaraian untuk LANDHUB - warna & label dari
// lib/geran/status.ts supaya dashboard, senarai & editor sentiasa sepadan.
export default function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const s = isStatusGeran(status)
    ? STATUS_INFO[status]
    : { label: status, badge: "bg-black/5 text-black/60 ring-black/10", dot: "bg-black/40" };
  const saiz = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11.5px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap ${saiz} ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
