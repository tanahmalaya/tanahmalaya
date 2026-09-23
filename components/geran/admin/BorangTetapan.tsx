"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { INPUT, KAD, LABEL } from "@/components/geran/admin/editor/types";
import type { TetapanGT } from "@/lib/geran/tetapan";

export default function BorangTetapan({ awal }: { awal: TetapanGT }) {
  const [whatsapp, setWhatsapp] = useState(awal.whatsapp);
  const [emel, setEmel] = useState(awal.emel);
  const [sibuk, setSibuk] = useState(false);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(null);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setMesej(null);
    try {
      const res = await fetch("/api/geran-admin/tetapan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, emel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setWhatsapp(data.whatsapp);
      setMesej({ ok: true, teks: "Settings saved." });
    } catch (err) {
      setMesej({ ok: false, teks: (err as Error).message });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <form onSubmit={simpan} className={`${KAD} p-5 sm:p-6 max-w-xl space-y-4`}>
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">Buyer contact</h2>
        <p className="text-xs text-black/45 mt-1">Shown on every public listing as the way buyers reach GT.</p>
      </div>
      <label className="block">
        <span className={LABEL}>WhatsApp number</span>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. 012-345 6789"
          inputMode="tel"
          className={INPUT}
        />
        <span className="block text-xs text-black/45 mt-1">
          Buyers get a WhatsApp button with the listing name and link filled in. Leave empty to show email only.
        </span>
      </label>
      <label className="block">
        <span className={LABEL}>Contact email</span>
        <input type="email" value={emel} onChange={(e) => setEmel(e.target.value)} className={INPUT} />
      </label>
      {mesej && (
        <p className={`text-sm rounded-lg px-3 py-2 ${mesej.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {mesej.teks}
        </p>
      )}
      <button
        type="submit"
        disabled={sibuk}
        className="inline-flex items-center gap-1.5 h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {sibuk ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
      </button>
    </form>
  );
}
