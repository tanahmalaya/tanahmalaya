"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { NEGERI_LIST } from "@/lib/aduanTanah";
import { STATUS_GERAN_LABEL } from "@/lib/geran";
import { GERAN_INPUT, GERAN_LABEL, GERAN_BTN_PRIMARY } from "@/components/geran/theme";

const TRIGGER_CHIP = "text-xs font-semibold text-[#0E3B2E] underline decoration-[#0E3B2E]/30 underline-offset-2";

type Status = keyof typeof STATUS_GERAN_LABEL;

export type DronePilotStatusInfo = {
  status: Status;
  catatanAdmin: string | null;
} | null;

const STATUS_BADGE: Record<Status, string> = {
  MENUNGGU_SEMAKAN: "bg-amber-50 text-amber-700 border border-amber-200",
  DISAHKAN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DITOLAK: "bg-red-50 text-red-600 border border-red-200",
};

export default function MohonDronePilotModal({
  namaPenjual,
  telefonPenjual,
  initialStatus,
  isLoggedIn,
  redirectPath,
}: {
  namaPenjual: string;
  telefonPenjual: string;
  initialStatus: DronePilotStatusInfo;
  isLoggedIn: boolean;
  redirectPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState(initialStatus);

  const [namaPenuh, setNamaPenuh] = useState(namaPenjual);
  const [telefon, setTelefon] = useState(telefonPenjual);
  const [negeri, setNegeri] = useState(NEGERI_LIST[0]);
  const [modelDrone, setModelDrone] = useState("");
  const [akuan, setAkuan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/drone-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPenuh, telefon, negeri, modelDrone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");

      setStatusInfo({ status: "MENUNGGU_SEMAKAN", catatanAdmin: null });
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`} className={TRIGGER_CHIP}>
        🚁 Select Role: Drone Pilot
      </Link>
    );
  }

  if (statusInfo) {
    return (
      <div className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-3.5 py-2.5">
        <span className="text-xs font-semibold text-[#0E3B2E]/70">Drone Pilot:</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[statusInfo.status]}`}>
          {STATUS_GERAN_LABEL[statusInfo.status]}
        </span>
        {statusInfo.status === "DITOLAK" && (
          <button
            onClick={() => setStatusInfo(null)}
            className="text-xs underline text-[#0E3B2E]/60 ml-auto"
          >
            Select role again
          </button>
        )}
        {statusInfo.status === "DITOLAK" && statusInfo.catatanAdmin && (
          <span className="sr-only">Reason: {statusInfo.catatanAdmin}</span>
        )}
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={TRIGGER_CHIP}>
        🚁 Select Role: Drone Pilot
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-[#0E3B2E]">Select Role: Drone Pilot</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#0E3B2E]/40 hover:text-[#0E3B2E] text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-[#0E3B2E]/60 text-sm mb-5">
              Help PLT capture aerial photos/footage for listings that request a drone survey. Fill in your
              details &amp; drone model below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={GERAN_LABEL}>Full Name</label>
                <input
                  required
                  value={namaPenuh}
                  onChange={(e) => setNamaPenuh(e.target.value)}
                  className={GERAN_INPUT}
                />
              </div>

              <div>
                <label className={GERAN_LABEL}>Phone No.</label>
                <input
                  required
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className={GERAN_INPUT}
                />
              </div>

              <div>
                <label className={GERAN_LABEL}>State of Service</label>
                <select value={negeri} onChange={(e) => setNegeri(e.target.value)} className={GERAN_INPUT}>
                  {NEGERI_LIST.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={GERAN_LABEL}>Drone Model</label>
                <input
                  required
                  value={modelDrone}
                  onChange={(e) => setModelDrone(e.target.value)}
                  placeholder="e.g. DJI Mavic 3"
                  className={GERAN_INPUT}
                />
              </div>

              <label className="flex items-start gap-3 bg-[#F7F5F1] rounded-xl p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={akuan}
                  onChange={(e) => setAkuan(e.target.checked)}
                  required
                  className="mt-0.5"
                />
                <span className="text-sm text-[#0E3B2E]/80">
                  I confirm the information above is true and accurate. False information may result in
                  account suspension.
                </span>
              </label>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <span>ℹ️</span>
                <span>
                  <span className="font-semibold">What happens next?</span> After you submit, PLT admin will
                  review your details and contact you directly to confirm before you're activated as a
                  Drone Pilot.
                </span>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-black/10 text-[#0E3B2E] font-semibold py-3 rounded-full"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading || !akuan} className={`flex-1 ${GERAN_BTN_PRIMARY}`}>
                  {loading ? "SUBMITTING..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
