"use client";

// Document Vault LANDHUB (tab Documents editor): senarai semak dokumen tanah,
// muat naik ke blob PERIBADI, dan tahap akses setiap dokumen (Admin /
// Consultant / Buyer / Public). Fail dibuka melalui /api/geran/dokumen/[id]
// yang menyemak akses - URL blob tak pernah dipapar.

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, FileText, ImageIcon, Loader2, Lock, Trash2, Upload } from "lucide-react";
import {
  AKSES_DOKUMEN,
  AKSES_LALAI,
  DOKUMEN_SENARAI_SEMAK,
  DOKUMEN_SENSITIF,
  JENIS_DOKUMEN,
  MAX_DOKUMEN,
  MAX_SAIZ_DOKUMEN_BYTES,
  MIME_DOKUMEN,
  SENARAI_AKSES,
  SENARAI_JENIS_DOKUMEN,
  formatSaiz,
  type AksesDokumenKey,
  type JenisDokumenKey,
} from "@/lib/geran/dokumen";
import { KAD, type DokumenForm, type EditorForm, type EditorMeta, type UbahForm } from "@/components/geran/admin/editor/types";

let kiraan = 0;

export default function TabDokumen({ form, ubah, meta }: { form: EditorForm; ubah: UbahForm; meta: EditorMeta }) {
  const failRef = useRef<HTMLInputElement>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const [jenisBaru, setJenisBaru] = useState<JenisDokumenKey>("GERAN");
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState("");

  const bolehMuatNaik = meta.storPeribadi && !sibuk;
  const ada = (j: JenisDokumenKey) => form.dokumen.some((d) => d.jenis === j) || (j === "GERAN" && meta.adaSalinanGeran);
  const lengkap = DOKUMEN_SENARAI_SEMAK.filter(ada).length;

  function ubahDok(kunci: string, p: Partial<DokumenForm>) {
    ubah({ dokumen: form.dokumen.map((d) => (d.kunci === kunci ? { ...d, ...p } : d)) });
  }

  function mulaMuatNaik(j: JenisDokumenKey) {
    setJenisBaru(j);
    failRef.current?.click();
  }

  async function muatNaik(senarai: FileList | null) {
    const fail = senarai?.[0];
    if (failRef.current) failRef.current.value = "";
    if (!fail) return;
    setRalat("");
    if (!(MIME_DOKUMEN as readonly string[]).includes(fail.type)) {
      setRalat("Only PDF, JPG, PNG or WebP files are accepted.");
      return;
    }
    if (fail.size > MAX_SAIZ_DOKUMEN_BYTES) {
      setRalat(`"${fail.name}" is larger than ${formatSaiz(MAX_SAIZ_DOKUMEN_BYTES)}.`);
      return;
    }
    if (form.dokumen.length >= MAX_DOKUMEN) {
      setRalat(`Maximum ${MAX_DOKUMEN} documents per listing.`);
      return;
    }
    setSibuk(true);
    try {
      const hasil = await upload(`geran/dokumen/${Date.now()}-${fail.name}`, fail, {
        access: "private",
        handleUploadUrl: "/api/geran/upload",
      });
      kiraan += 1;
      const baru: DokumenForm = {
        kunci: `dok-${Date.now()}-${kiraan}`,
        id: null,
        jenis: jenisBaru,
        nama: fail.name,
        url: hasil.url,
        saizBait: fail.size,
        mime: fail.type,
        akses: AKSES_LALAI[jenisBaru],
      };
      ubah({ dokumen: [...formRef.current.dokumen, baru] });
    } catch (e) {
      setRalat(`"${fail.name}" could not be uploaded (${(e as Error).message || "error"}). Please try again.`);
    } finally {
      setSibuk(false);
    }
  }

  function tukarAkses(d: DokumenForm, akses: AksesDokumenKey) {
    if (
      akses === "PUBLIC" &&
      DOKUMEN_SENSITIF.includes(d.jenis) &&
      !window.confirm(
        `${JENIS_DOKUMEN[d.jenis]} usually contains the owner's name, IC number and address. Make it visible to anyone viewing the listing?`
      )
    )
      return;
    ubahDok(d.kunci, { akses });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
      <input ref={failRef} type="file" accept={MIME_DOKUMEN.join(",")} className="hidden" onChange={(e) => muatNaik(e.target.files)} />

      <section className={`${KAD} p-5 self-start`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">Checklist</h2>
          <span className="text-xs font-semibold text-black/50">
            {lengkap}/{DOKUMEN_SENARAI_SEMAK.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden mb-4">
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${(lengkap / DOKUMEN_SENARAI_SEMAK.length) * 100}%` }} />
        </div>
        <ul className="space-y-1">
          {DOKUMEN_SENARAI_SEMAK.map((j) => (
            <li key={j} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.02]">
              {ada(j) ? <CheckCircle2 size={17} className="text-emerald-600 shrink-0" /> : <Circle size={17} className="text-black/25 shrink-0" />}
              <span className={`flex-1 text-sm ${ada(j) ? "font-semibold" : "text-black/60"}`}>{JENIS_DOKUMEN[j]}</span>
              <button
                type="button"
                onClick={() => mulaMuatNaik(j)}
                disabled={!bolehMuatNaik}
                className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40"
              >
                {ada(j) ? "Add" : "Upload"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 pt-3 border-t border-black/[0.06] text-xs text-black/45 flex gap-2">
          <Lock size={14} className="shrink-0 mt-0.5" />
          Files are stored privately and only open through LANDHUB after an access check.
        </p>
      </section>

      <section className={`${KAD} p-5 sm:p-6 min-w-0`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">
            Documents <span className="text-black/35">({form.dokumen.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={jenisBaru}
              onChange={(e) => setJenisBaru(e.target.value as JenisDokumenKey)}
              aria-label="Document type"
              className="h-9 rounded-lg border border-black/[0.12] bg-white px-2 text-sm"
            >
              {SENARAI_JENIS_DOKUMEN.map((j) => (
                <option key={j} value={j}>
                  {JENIS_DOKUMEN[j]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => failRef.current?.click()}
              disabled={!bolehMuatNaik}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-emerald-700 px-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Upload Document
            </button>
          </div>
        </div>

        {!meta.storPeribadi && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-900 flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Private storage is not set up.</strong> Documents need a separate private Vercel Blob store — the
              current store is public. Add its token as <code className="text-xs">DOCUMENTS_READ_WRITE_TOKEN</code>{" "}
              to enable uploads.
            </span>
          </div>
        )}
        {ralat && <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{ralat}</p>}

        <ul className="space-y-2">
          {meta.adaSalinanGeran && (
            <li className="flex items-center gap-3 rounded-xl border border-black/[0.07] px-3 py-2.5">
              <span className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">Full title copy — submitted by seller</span>
                <span className="block text-xs text-black/45">{JENIS_DOKUMEN.GERAN} · PDF</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${AKSES_DOKUMEN.ADMIN.badge}`}>
                {AKSES_DOKUMEN.ADMIN.label}
              </span>
              <a
                href={`/api/geran-admin/salinan-geran/${meta.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-black/50 hover:bg-black/5"
                title="Open"
              >
                <ExternalLink size={15} />
              </a>
            </li>
          )}
          {form.dokumen.map((d) => {
            const sensitifAwam = d.akses === "PUBLIC" && DOKUMEN_SENSITIF.includes(d.jenis);
            return (
              <li key={d.kunci} className="rounded-xl border border-black/[0.07] px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-black/[0.04] text-black/55 flex items-center justify-center shrink-0">
                    {d.mime === "application/pdf" ? <FileText size={18} /> : <ImageIcon size={18} />}
                  </span>
                  <span className="flex-1 min-w-[180px]">
                    <input
                      value={d.nama}
                      onChange={(e) => ubahDok(d.kunci, { nama: e.target.value })}
                      aria-label="Document name"
                      className="w-full bg-transparent text-sm font-semibold outline-none focus:bg-black/[0.03] rounded px-1 -mx-1"
                    />
                    <span className="block text-xs text-black/45">
                      {formatSaiz(d.saizBait)}
                      {!d.id && " · not saved yet"}
                    </span>
                  </span>
                  <select
                    value={d.jenis}
                    onChange={(e) => ubahDok(d.kunci, { jenis: e.target.value as JenisDokumenKey })}
                    aria-label="Type"
                    className="h-8 rounded-lg border border-black/[0.1] bg-white px-2 text-xs"
                  >
                    {SENARAI_JENIS_DOKUMEN.map((j) => (
                      <option key={j} value={j}>
                        {JENIS_DOKUMEN[j]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={d.akses}
                    onChange={(e) => tukarAkses(d, e.target.value as AksesDokumenKey)}
                    aria-label="Access"
                    title={AKSES_DOKUMEN[d.akses].nota}
                    className={`h-8 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset border-0 ${AKSES_DOKUMEN[d.akses].badge}`}
                  >
                    {SENARAI_AKSES.map((a) => (
                      <option key={a} value={a}>
                        {AKSES_DOKUMEN[a].label}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center gap-0.5">
                    {d.id ? (
                      <a
                        href={`/api/geran/dokumen/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-black/50 hover:bg-black/5"
                        title="Open"
                      >
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => ubah({ dokumen: form.dokumen.filter((x) => x.kunci !== d.kunci) })}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
                {sensitifAwam && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-md px-2 py-1">
                    <AlertTriangle size={13} /> Public — anyone viewing the listing can open this {JENIS_DOKUMEN[d.jenis]}.
                  </p>
                )}
              </li>
            );
          })}
          {form.dokumen.length === 0 && !meta.adaSalinanGeran && (
            <li className="rounded-xl border-2 border-dashed border-black/10 py-10 text-center text-sm text-black/45">
              No documents yet. Pick a type and upload, or use the checklist.
            </li>
          )}
        </ul>

        <div className="mt-5 pt-4 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SENARAI_AKSES.map((a) => (
            <p key={a} className="flex items-center gap-2 text-xs text-black/55">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${AKSES_DOKUMEN[a].badge}`}>
                {AKSES_DOKUMEN[a].label}
              </span>
              {AKSES_DOKUMEN[a].nota}
            </p>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-black/40">
          <strong className="font-semibold">Note:</strong> consultant accounts are not set up yet, so
          &ldquo;Consultant&rdquo; documents are currently visible to admins only.
        </p>
      </section>
    </div>
  );
}
