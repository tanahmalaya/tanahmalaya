"use client";

// Media Manager LANDHUB (tab Media editor): gambar penyenaraian dengan seret
// untuk susun semula, muat naik berbilang yang dimampat ke WebP dalam pelayar,
// dan ringkasan panorama 360°. Gambar pertama = gambar muka (direktori & WhatsApp).

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Loader2, MapPin, Orbit, Star, Trash2 } from "lucide-react";
import { MAX_GAMBAR_GERAN, MAX_SAIZ_GAMBAR_BYTES } from "@/lib/geran";
import { KAD, type EditorForm, type UbahForm } from "@/components/geran/admin/editor/types";

// Sisi terpanjang selepas mampatan - cukup tajam untuk galeri skrin penuh
// dan zum dalam Lot Marker, tapi ~10x lebih kecil daripada JPEG kamera/drone.
const SISI_MAKS = 2560;
const KUALITI_WEBP = 0.82;

async function mampatGambar(fail: File): Promise<Blob> {
  const bmp = await createImageBitmap(fail);
  const skala = Math.min(1, SISI_MAKS / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * skala);
  const h = Math.round(bmp.height * skala);
  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  kanvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((selesai, gagal) =>
    kanvas.toBlob((b) => (b ? selesai(b) : gagal(new Error("Could not compress"))), "image/webp", KUALITI_WEBP)
  );
}

function Tajuk({ children, nota, kanan }: { children: React.ReactNode; nota?: string; kanan?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-black/55">{children}</h2>
        {nota && <p className="text-xs text-black/45 mt-1">{nota}</p>}
      </div>
      {kanan}
    </div>
  );
}

export default function TabMedia({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  const pathname = usePathname();
  const failRef = useRef<HTMLInputElement>(null);
  // Borang terkini untuk kerja async (muat naik boleh ambil masa lama).
  const formRef = useRef(form);
  formRef.current = form;
  const [seret, setSeret] = useState<number | null>(null);
  const [atas, setAtas] = useState<number | null>(null);
  const [kemajuan, setKemajuan] = useState<string | null>(null);
  const [ralat, setRalat] = useState<string[]>([]);

  const gambar = form.gambarUrls;
  const bakiSlot = MAX_GAMBAR_GERAN - gambar.length;

  // Bilangan bentuk Lot Marker atas setiap gambar - amaran sebelum dipadam.
  const bentukPada = (u: string) => form.penanda[u]?.ciri.length ?? 0;

  function susun(dari: number, ke: number) {
    if (dari === ke || ke < 0 || ke >= gambar.length) return;
    const baru = [...gambar];
    const [x] = baru.splice(dari, 1);
    baru.splice(ke, 0, x);
    ubah({ gambarUrls: baru });
  }

  function padam(u: string) {
    const n = bentukPada(u);
    if (n > 0 && !window.confirm(`This photo has ${n} lot/road shapes drawn on it. Delete the photo and its shapes?`)) return;
    const penanda = { ...form.penanda };
    delete penanda[u];
    ubah({ gambarUrls: gambar.filter((x) => x !== u), penanda });
  }

  async function muatNaik(senarai: FileList | null) {
    const fail = Array.from(senarai ?? []).filter((f) => f.type.startsWith("image/"));
    if (failRef.current) failRef.current.value = "";
    if (fail.length === 0) return;
    const ralatBaru: string[] = [];
    if (fail.length > bakiSlot) ralatBaru.push(`Only ${bakiSlot} more photos fit (maximum ${MAX_GAMBAR_GERAN}).`);
    const url: string[] = [];
    for (const [i, f] of fail.slice(0, bakiSlot).entries()) {
      setKemajuan(`Compressing & uploading ${i + 1} of ${Math.min(fail.length, bakiSlot)}…`);
      try {
        const blob = await mampatGambar(f);
        if (blob.size > MAX_SAIZ_GAMBAR_BYTES) throw new Error("too large even after compression");
        const hasil = await upload(`geran/gambar/${Date.now()}-${f.name.replace(/\.[^.]+$/, "")}.webp`, blob, {
          access: "public",
          handleUploadUrl: "/api/geran/upload",
          contentType: "image/webp",
        });
        url.push(hasil.url);
      } catch (e) {
        ralatBaru.push(`"${f.name}" could not be uploaded (${(e as Error).message || "error"}).`);
      }
    }
    // Ambil senarai terkini (formRef) - bukan `gambar` dari render semasa
    // butang ditekan - supaya muat naik yang panjang tak menimpa susunan atau
    // pemadaman yang admin buat sementara menunggu.
    if (url.length > 0) ubah({ gambarUrls: [...formRef.current.gambarUrls, ...url] });
    setRalat(ralatBaru);
    setKemajuan(null);
  }

  return (
    <div className="space-y-5">
      <section className={`${KAD} p-5 sm:p-6`}>
        <Tajuk
          nota="Drag to reorder. The first photo is the cover in the directory and link previews. Photos are converted to WebP in your browser before upload."
          kanan={
            <button
              type="button"
              onClick={() => failRef.current?.click()}
              disabled={!!kemajuan || bakiSlot <= 0}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-emerald-700 px-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {kemajuan ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              Upload Photos
            </button>
          }
        >
          Property Photos <span className="text-black/35">({gambar.length}/{MAX_GAMBAR_GERAN})</span>
        </Tajuk>
        <input ref={failRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => muatNaik(e.target.files)} />

        {kemajuan && <p className="mb-3 text-sm text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">{kemajuan}</p>}
        {ralat.map((r) => (
          <p key={r} className="mb-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
            {r}
          </p>
        ))}

        {gambar.length === 0 ? (
          <button
            type="button"
            onClick={() => failRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-black/15 py-12 text-sm text-black/50 hover:bg-black/[0.02]"
          >
            <ImagePlus size={26} className="mx-auto mb-2 text-black/30" />
            Upload aerial, drone or ground photos
          </button>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {gambar.map((u, i) => (
              <li
                key={u}
                draggable
                onDragStart={(e) => {
                  setSeret(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setAtas(i);
                }}
                onDragLeave={() => setAtas((x) => (x === i ? null : x))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (seret !== null) susun(seret, i);
                  setSeret(null);
                  setAtas(null);
                }}
                onDragEnd={() => {
                  setSeret(null);
                  setAtas(null);
                }}
                className={`group relative rounded-xl overflow-hidden border-2 bg-black/[0.03] transition ${
                  atas === i && seret !== i ? "border-emerald-500 scale-[1.02]" : "border-transparent"
                } ${seret === i ? "opacity-40" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Photo ${i + 1}`} className="w-full aspect-[4/3] object-cover pointer-events-none" draggable={false} />
                <span className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="rounded-md bg-black/60 p-1 text-white cursor-grab" title="Drag to reorder">
                    <GripVertical size={14} />
                  </span>
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-amber-950">
                      <Star size={11} /> Cover
                    </span>
                  )}
                </span>
                {bentukPada(u) > 0 && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    <MapPin size={11} /> {bentukPada(u)} marked
                  </span>
                )}
                {/* Butang untuk skrin sentuh - seret HTML5 tak berfungsi di telefon. */}
                <span className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  {i > 0 && (
                    <button type="button" onClick={() => susun(i, 0)} className="rounded-md bg-black/60 p-1 text-white" title="Make cover">
                      <Star size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => susun(i, i - 1)} disabled={i === 0} className="rounded-md bg-black/60 p-1 text-white disabled:opacity-30" title="Move earlier">
                    <ArrowLeft size={14} />
                  </button>
                  <button type="button" onClick={() => susun(i, i + 1)} disabled={i === gambar.length - 1} className="rounded-md bg-black/60 p-1 text-white disabled:opacity-30" title="Move later">
                    <ArrowRight size={14} />
                  </button>
                  <button type="button" onClick={() => padam(u)} className="rounded-md bg-red-600/90 p-1 text-white" title="Delete photo">
                    <Trash2 size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${KAD} p-5 sm:p-6`}>
        <Tajuk
          nota="Hotspots, camera position and the Explore tour are edited in the 360° tab."
          kanan={
            <Link
              href={`${pathname}?tab=360`}
              scroll={false}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-black/[0.12] px-3.5 text-sm font-semibold hover:bg-black/[0.03]"
            >
              <Orbit size={15} /> Edit 360°
            </Link>
          }
        >
          360° Panoramas <span className="text-black/35">({form.panorama.length})</span>
        </Tajuk>
        {form.panorama.length === 0 ? (
          <p className="text-sm text-black/45">No 360° photos yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {form.panorama.map((p, i) => (
              <li key={p.kunci} className="rounded-xl border border-black/[0.07] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full aspect-[2/1] object-cover" />
                <div className="px-3 py-2.5 text-sm">
                  <p className="font-semibold truncate">{p.tajuk || `360° photo ${i + 1}`}</p>
                  <p className="text-xs text-black/50 mt-0.5 tabular-nums">
                    {p.hotspots.length} hotspots ·{" "}
                    {p.latitude && p.longitude ? `Camera ${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}` : "Camera position not set"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
