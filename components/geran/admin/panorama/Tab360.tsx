"use client";

// Tab 360° dalam Land Listing Editor: muat naik panorama equirectangular,
// letak hotspot (Main Road, River, Lot Boundary, ...), paut hotspot ke lot,
// sambung panorama dengan anak panah "Explore", dan letak kedudukan kamera
// atas peta satelit. Semua disimpan bersama butang Save editor.

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
// CSS viewer dimuat di sini (statik), bukan hanya dalam chunk dinamik
// Viewer360 - PSV memeriksa gayanya semasa dibina dan akan mengadu kalau
// fail CSS belum sampai.
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Crosshair,
  Loader2,
  Move,
  Orbit,
  Trash2,
  Upload,
} from "lucide-react";
import {
  JENIS_HOTSPOT,
  LEBAR_MAKS_360,
  MAX_HOTSPOT,
  MAX_PANORAMA,
  SENARAI_JENIS_HOTSPOT,
  tajukHotspot,
  type Hotspot,
  type JenisHotspot,
} from "@/lib/geran/panorama";
import { STATUS_LOT } from "@/components/geran/admin/editor/lotShared";
import { INPUT, KAD, LABEL, type EditorForm, type PanoramaForm, type UbahForm } from "@/components/geran/admin/editor/types";
import type { Api360 } from "@/components/geran/panorama/Viewer360";

const Viewer360 = dynamic(() => import("@/components/geran/panorama/Viewer360"), {
  ssr: false,
  loading: () => <div className="h-[520px] bg-[#1F2A24] animate-pulse" />,
});
const PetaKamera = dynamic(() => import("./PetaKamera"), {
  ssr: false,
  loading: () => <div className="h-56 rounded-lg bg-black/[0.05] animate-pulse" />,
});

let kiraan = 0;
const idBaru = (awalan: string) => {
  kiraan += 1;
  return `${awalan}-${Date.now().toString(36)}-${kiraan}`;
};

// Mampat & tukar ke WebP dalam pelayar. Kamera 360° menghasilkan JPEG 15-30 MB;
// 8192 px lebar dalam WebP biasanya 2-5 MB tanpa beza ketara dalam viewer.
async function mampat360(fail: File): Promise<Blob> {
  const bmp = await createImageBitmap(fail);
  const nisbah = bmp.width / bmp.height;
  if (Math.abs(nisbah - 2) > 0.1) {
    bmp.close();
    throw new Error(
      `This photo is ${bmp.width}×${bmp.height}. A 360° photo must be equirectangular (twice as wide as it is tall).`
    );
  }
  const lebar = Math.min(bmp.width, LEBAR_MAKS_360);
  const tinggi = Math.round(lebar / 2);
  const kanvas = document.createElement("canvas");
  kanvas.width = lebar;
  kanvas.height = tinggi;
  kanvas.getContext("2d")!.drawImage(bmp, 0, 0, lebar, tinggi);
  bmp.close();
  return new Promise((selesai, gagal) =>
    kanvas.toBlob((b) => (b ? selesai(b) : gagal(new Error("Could not compress the photo."))), "image/webp", 0.85)
  );
}

type Mod = { jenis: "letak"; hotspot: JenisHotspot } | { jenis: "alih"; id: string } | null;

export default function Tab360({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  const [aktif, setAktif] = useState<string | null>(form.panorama[0]?.kunci ?? null);
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [mod, setMod] = useState<Mod>(null);
  const [muatNaik, setMuatNaik] = useState<string | null>(null);
  const [ralat, setRalat] = useState("");
  const apiRef = useRef<Api360 | null>(null);
  const failRef = useRef<HTMLInputElement>(null);

  const pano = form.panorama.find((p) => p.kunci === aktif) ?? null;
  const hotspot = pano?.hotspots.find((h) => h.id === dipilih) ?? null;
  const lotIkutKunci = useMemo(() => new Map(form.lots.map((l) => [l.kunci, l])), [form.lots]);

  function ubahPano(kunci: string, p: Partial<PanoramaForm>) {
    ubah({ panorama: form.panorama.map((x) => (x.kunci === kunci ? { ...x, ...p } : x)) });
  }

  function ubahHotspot(id: string, p: Partial<Hotspot>) {
    if (!pano) return;
    ubahPano(pano.kunci, { hotspots: pano.hotspots.map((h) => (h.id === id ? { ...h, ...p } : h)) });
  }

  async function pilihFail(senarai: FileList | null) {
    const fail = senarai?.[0];
    if (failRef.current) failRef.current.value = "";
    if (!fail) return;
    if (form.panorama.length >= MAX_PANORAMA) {
      setRalat(`Maximum ${MAX_PANORAMA} 360° photos per listing.`);
      return;
    }
    setRalat("");
    try {
      setMuatNaik("Compressing…");
      const blob = await mampat360(fail);
      setMuatNaik(`Uploading ${(blob.size / (1024 * 1024)).toFixed(1)} MB…`);
      const hasil = await upload(`geran/360/${Date.now()}.webp`, blob, {
        access: "public",
        handleUploadUrl: "/api/geran/upload",
        contentType: "image/webp",
      });
      const baru: PanoramaForm = {
        kunci: idBaru("pano"),
        id: null,
        url: hasil.url,
        tajuk: fail.name.replace(/\.[^.]+$/, "").slice(0, 80),
        latitude: form.latitude,
        longitude: form.longitude,
        lotId: "",
        yawAwal: 0,
        hotspots: [],
      };
      ubah({ panorama: [...form.panorama, baru] });
      setAktif(baru.kunci);
      setDipilih(null);
    } catch (e) {
      setRalat((e as Error).message || "Upload failed.");
    } finally {
      setMuatNaik(null);
    }
  }

  function klikPanorama(yaw: number, pitch: number) {
    if (!pano || !mod) {
      setDipilih(null);
      return;
    }
    const y = Math.round(yaw * 100) / 100;
    const p = Math.round(pitch * 100) / 100;
    if (mod.jenis === "alih") {
      ubahHotspot(mod.id, { yaw: y, pitch: p });
      setMod(null);
      return;
    }
    if (pano.hotspots.length >= MAX_HOTSPOT) {
      setRalat(`Maximum ${MAX_HOTSPOT} hotspots per 360° photo.`);
      return;
    }
    const h: Hotspot = {
      id: idBaru("hs"),
      jenis: mod.hotspot,
      yaw: y,
      pitch: p,
      label: null,
      // Hotspot sempadan lot terus dipaut ke lot tempat kamera berdiri.
      lotId: mod.hotspot === "LOT_BOUNDARY" ? pano.lotId || null : null,
      keScene: mod.hotspot === "EXPLORE" ? form.panorama.find((x) => x.kunci !== pano.kunci)?.kunci ?? null : null,
    };
    ubahPano(pano.kunci, { hotspots: [...pano.hotspots, h] });
    setDipilih(h.id);
    setMod(null);
  }

  function padamPanorama() {
    if (!pano || !window.confirm("Remove this 360° photo and its hotspots? It is removed when you save.")) return;
    const baki = form.panorama
      .filter((p) => p.kunci !== pano.kunci)
      // Anak panah Explore yang menuju panorama ini kini tiada sasaran.
      .map((p) => ({ ...p, hotspots: p.hotspots.map((h) => (h.keScene === pano.kunci ? { ...h, keScene: null } : h)) }));
    ubah({ panorama: baki });
    setAktif(baki[0]?.kunci ?? null);
    setDipilih(null);
  }

  function alihSusunan(arah: -1 | 1) {
    if (!pano) return;
    const i = form.panorama.findIndex((p) => p.kunci === pano.kunci);
    const j = i + arah;
    if (j < 0 || j >= form.panorama.length) return;
    const baru = [...form.panorama];
    [baru[i], baru[j]] = [baru[j], baru[i]];
    ubah({ panorama: baru });
  }

  const pusatPeta: [number, number] = [
    Number(pano?.latitude || form.latitude) || 4.2105,
    Number(pano?.longitude || form.longitude) || 101.9758,
  ];
  const warnaLot = (lotId: string | null | undefined) => {
    const lot = lotId ? lotIkutKunci.get(lotId) : undefined;
    return lot ? STATUS_LOT[lot.status].hex : "#E5E7EB";
  };

  const butangMuatNaik = (
    <button
      type="button"
      onClick={() => failRef.current?.click()}
      disabled={!!muatNaik}
      className="h-16 px-4 rounded-lg border-2 border-dashed border-black/15 text-sm font-semibold text-black/60 hover:bg-black/[0.03] inline-flex items-center gap-2 shrink-0 disabled:opacity-60"
    >
      {muatNaik ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      {muatNaik ?? "Upload 360°"}
    </button>
  );

  return (
    <div className="space-y-3">
      <input ref={failRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pilihFail(e.target.files)} />

      <div className={`${KAD} p-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]`}>
        {form.panorama.map((p, i) => (
          <button
            key={p.kunci}
            type="button"
            onClick={() => {
              setAktif(p.kunci);
              setDipilih(null);
              setMod(null);
            }}
            className={`relative h-16 w-32 shrink-0 rounded-lg overflow-hidden border-2 ${
              p.kunci === aktif ? "border-emerald-600" : "border-transparent opacity-75 hover:opacity-100"
            }`}
            title={p.tajuk || `360° photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-[10.5px] font-semibold text-white truncate text-left">
              {i + 1}. {p.tajuk || "360° photo"}
            </span>
          </button>
        ))}
        {butangMuatNaik}
      </div>

      {ralat && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{ralat}</p>}

      {!pano ? (
        <div className={`${KAD} p-10 flex flex-col items-center text-center`}>
          <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
            <Orbit size={22} />
          </span>
          <p className="font-bold">No 360° photos yet</p>
          <p className="text-sm text-black/50 mt-1 max-w-md">
            Upload an equirectangular 360° photo (from a 360° camera or a phone panorama app). It is compressed to WebP in
            your browser before uploading.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_300px]">
          {/* Jenis hotspot */}
          <div className={`${KAD} p-2.5 self-start`}>
            <p className="px-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">Add hotspot</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-0.5">
              {SENARAI_JENIS_HOTSPOT.map((j) => {
                const armed = mod?.jenis === "letak" && mod.hotspot === j;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setMod(armed ? null : { jenis: "letak", hotspot: j })}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-left transition-colors ${
                      armed ? "bg-emerald-600/10 text-emerald-800 font-semibold" : "text-black/65 hover:bg-black/[0.04]"
                    }`}
                  >
                    <span className="w-5 text-center">{JENIS_HOTSPOT[j].emoji}</span>
                    <span className="truncate">{j === "EXPLORE" ? "Explore arrow" : JENIS_HOTSPOT[j].label}</span>
                  </button>
                );
              })}
            </div>
            {pano.hotspots.length > 0 && (
              <>
                <p className="px-1.5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">
                  On this photo ({pano.hotspots.length})
                </p>
                <ul className="space-y-0.5">
                  {pano.hotspots.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setDipilih(h.id);
                          apiRef.current?.pusing(h.yaw);
                        }}
                        className={`w-full flex items-center gap-2 rounded-lg px-2 py-1 text-[12.5px] text-left ${
                          h.id === dipilih ? "bg-black/[0.06] font-semibold" : "text-black/65 hover:bg-black/[0.04]"
                        }`}
                      >
                        <span className="w-5 text-center">{JENIS_HOTSPOT[h.jenis].emoji}</span>
                        <span className="truncate">{tajukHotspot(h)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Viewer */}
          <div className={`${KAD} overflow-hidden min-w-0 relative`}>
            <Viewer360
              url={pano.url}
              kunciScene={pano.kunci}
              yawAwal={pano.yawAwal}
              hotspots={pano.hotspots}
              dipilih={dipilih}
              onKlikPanorama={klikPanorama}
              onKlikHotspot={(id) => {
                setDipilih(id);
                setMod(null);
              }}
              onSedia={(api) => (apiRef.current = api)}
              kelas="h-[440px] sm:h-[520px]"
            />
            <p className="absolute top-3 left-3 right-3 sm:right-auto z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/90 pointer-events-none">
              {mod?.jenis === "letak" ? (
                <>
                  <strong className="text-white">{JENIS_HOTSPOT[mod.hotspot].label}:</strong> click on the photo where it is.
                </>
              ) : mod?.jenis === "alih" ? (
                <>
                  <strong className="text-white">Move:</strong> click the new position for this hotspot.
                </>
              ) : (
                "Drag to look around. Pick a hotspot type on the left, then click the photo to place it."
              )}
            </p>
          </div>

          {/* Panel kanan */}
          <div className={`${KAD} p-4 self-start min-w-0 lg:col-span-2 xl:col-span-1`}>
            {hotspot ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">Hotspot</p>
                  <button
                    type="button"
                    onClick={() => {
                      ubahPano(pano.kunci, { hotspots: pano.hotspots.filter((h) => h.id !== hotspot.id) });
                      setDipilih(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
                <label className="block">
                  <span className={LABEL}>Type</span>
                  <select value={hotspot.jenis} onChange={(e) => ubahHotspot(hotspot.id, { jenis: e.target.value as JenisHotspot })} className={INPUT}>
                    {SENARAI_JENIS_HOTSPOT.map((j) => (
                      <option key={j} value={j}>
                        {JENIS_HOTSPOT[j].emoji} {JENIS_HOTSPOT[j].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Label</span>
                  <input
                    value={hotspot.label ?? ""}
                    onChange={(e) => ubahHotspot(hotspot.id, { label: e.target.value })}
                    placeholder={JENIS_HOTSPOT[hotspot.jenis].label}
                    className={INPUT}
                  />
                </label>
                {hotspot.jenis === "EXPLORE" ? (
                  <label className="block">
                    <span className={LABEL}>Goes to</span>
                    <select
                      value={hotspot.keScene ?? ""}
                      onChange={(e) => ubahHotspot(hotspot.id, { keScene: e.target.value || null })}
                      className={INPUT}
                    >
                      <option value="">— Choose a 360° photo —</option>
                      {form.panorama
                        .filter((p) => p.kunci !== pano.kunci)
                        .map((p, i) => (
                          <option key={p.kunci} value={p.kunci}>
                            {p.tajuk || `360° photo ${i + 1}`}
                          </option>
                        ))}
                    </select>
                    {hotspot.keScene && (
                      <button
                        type="button"
                        onClick={() => {
                          setAktif(hotspot.keScene);
                          setDipilih(null);
                        }}
                        className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Open that 360° photo →
                      </button>
                    )}
                  </label>
                ) : (
                  <label className="block">
                    <span className={LABEL}>Linked lot</span>
                    <select
                      value={hotspot.lotId ?? ""}
                      onChange={(e) => ubahHotspot(hotspot.id, { lotId: e.target.value || null })}
                      className={INPUT}
                    >
                      <option value="">— None —</option>
                      {form.lots.map((l) => (
                        <option key={l.kunci} value={l.kunci}>
                          {l.noLot || "Untitled lot"}
                        </option>
                      ))}
                    </select>
                    <span className="block text-xs text-black/45 mt-1">
                      Buyers see the lot&apos;s number, area, price and status when they tap this hotspot.
                    </span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setMod({ jenis: "alih", id: hotspot.id })}
                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    mod?.jenis === "alih" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-black/[0.12] hover:bg-black/[0.03]"
                  }`}
                >
                  <Move size={15} /> {mod?.jenis === "alih" ? "Click the new position…" : "Move hotspot"}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">360° photo</p>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => alihSusunan(-1)} className="p-1.5 rounded-md hover:bg-black/5" title="Move earlier">
                      <ArrowLeft size={14} />
                    </button>
                    <button type="button" onClick={() => alihSusunan(1)} className="p-1.5 rounded-md hover:bg-black/5" title="Move later">
                      <ArrowRight size={14} />
                    </button>
                    <button type="button" onClick={padamPanorama} className="p-1.5 rounded-md text-red-600 hover:bg-red-50" title="Remove 360° photo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <label className="block">
                  <span className={LABEL}>Title</span>
                  <input
                    value={pano.tajuk}
                    onChange={(e) => ubahPano(pano.kunci, { tajuk: e.target.value })}
                    placeholder="e.g. View from the main road"
                    className={INPUT}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Camera stands on lot</span>
                  <select value={pano.lotId} onChange={(e) => ubahPano(pano.kunci, { lotId: e.target.value })} className={INPUT}>
                    <option value="">— None —</option>
                    {form.lots.map((l) => (
                      <option key={l.kunci} value={l.kunci}>
                        {l.noLot || "Untitled lot"}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs text-black/45 mt-1">Clicking this lot on the map opens this 360° view.</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const yaw = apiRef.current?.ambilYaw();
                    if (yaw !== undefined) ubahPano(pano.kunci, { yawAwal: Math.round(yaw * 10) / 10 });
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/[0.12] px-3 py-2 text-sm font-semibold hover:bg-black/[0.03]"
                >
                  <Compass size={15} /> Start view here
                </button>
                <p className="text-xs text-black/45 -mt-2">Buyers first face this direction ({Math.round(pano.yawAwal)}°).</p>

                <div>
                  <span className={LABEL}>
                    <Crosshair size={13} className="inline -mt-0.5 mr-1" />
                    Camera position — click the map
                  </span>
                  <PetaKamera
                    pusat={pusatPeta}
                    lat={pano.latitude ? Number(pano.latitude) : null}
                    lng={pano.longitude ? Number(pano.longitude) : null}
                    onPilih={(lat, lng) => ubahPano(pano.kunci, { latitude: lat.toFixed(6), longitude: lng.toFixed(6) })}
                    bentuk={form.penandaPeta.ciri}
                    warnaLot={warnaLot}
                    kameraLain={form.panorama
                      .filter((p) => p.kunci !== pano.kunci && p.latitude && p.longitude)
                      .map((p) => ({ kunci: p.kunci, lat: Number(p.latitude), lng: Number(p.longitude), tajuk: p.tajuk || "360° photo" }))}
                  />
                  <p className="text-[11px] text-black/40 mt-1 tabular-nums">
                    {pano.latitude && pano.longitude ? `${pano.latitude}, ${pano.longitude}` : "Not set"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
