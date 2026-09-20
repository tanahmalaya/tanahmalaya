"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_GERAN_LABEL } from "@/lib/geran";

type Status = keyof typeof STATUS_GERAN_LABEL;

export type RenAdminRow = {
  id: string;
  seq: number;
  namaPenuh: string;
  telefon: string;
  negeri: string;
  noRen: string;
  status: Status;
  catatanAdmin: string | null;
  createdAt: string;
};

const TAB_DEF: { key: Status; label: string }[] = [
  { key: "MENUNGGU_SEMAKAN", label: "Pending" },
  { key: "DISAHKAN", label: "Approved" },
  { key: "DITOLAK", label: "Rejected" },
];

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RenAdminTable({ rows }: { rows: RenAdminRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>("MENUNGGU_SEMAKAN");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const visible = rows.filter((r) => r.status === tab);
  const counts = TAB_DEF.reduce<Record<Status, number>>((acc, t) => {
    acc[t.key] = rows.filter((r) => r.status === t.key).length;
    return acc;
  }, {} as Record<Status, number>);

  async function updateStatus(permohonanId: string, status: "DISAHKAN" | "DITOLAK", catatanAdmin?: string) {
    const res = await fetch("/api/geran-admin/ren/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permohonanId, status, catatanAdmin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
  }

  async function handleAction(permohonanId: string, status: "DISAHKAN" | "DITOLAK", catatanAdmin?: string) {
    setLoadingId(permohonanId);
    try {
      await updateStatus(permohonanId, status, catatanAdmin);
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-brand-dark/10 overflow-x-auto">
        {TAB_DEF.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-brand-gold text-brand-dark" : "border-transparent text-brand-dark/50 hover:text-brand-dark"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-brand-dark/50 text-sm">No applications in this category.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <div key={p.id} className="bg-white border border-brand-dark/10 rounded-md p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <p className="font-semibold">
                    #{p.seq} — {p.namaPenuh}
                  </p>
                  <p className="text-xs text-brand-dark/50">
                    {p.negeri} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[p.status]}`}>
                  {STATUS_GERAN_LABEL[p.status]}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-brand-dark/60 mb-1">
                <p>
                  <span className="text-brand-dark/40">Phone:</span> {p.telefon}
                </p>
                <p>
                  <span className="text-brand-dark/40">REN No.:</span> {p.noRen}
                </p>
              </div>

              {p.status === "DITOLAK" && p.catatanAdmin && (
                <p className="text-xs text-red-600 mt-2">Rejection reason: {p.catatanAdmin}</p>
              )}

              {p.status === "MENUNGGU_SEMAKAN" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark/10">
                  <button
                    onClick={() => handleAction(p.id, "DISAHKAN")}
                    disabled={loadingId === p.id}
                    className="bg-brand-dark text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                    disabled={loadingId === p.id}
                    className="border border-red-300 text-red-600 text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    REJECT
                  </button>
                </div>
              )}

              {rejectingId === p.id && (
                <div className="mt-3 pt-3 border-t border-brand-dark/10">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Rejection reason</label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-sm border border-brand-dark/20 rounded-sm p-2 mb-2"
                    placeholder="e.g. REN registration number is invalid"
                  />
                  <button
                    onClick={() => handleAction(p.id, "DITOLAK", rejectReason)}
                    disabled={loadingId === p.id || !rejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-semibold rounded-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    CONFIRM REJECT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
