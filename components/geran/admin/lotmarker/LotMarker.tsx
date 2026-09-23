"use client";

// Lot Marker LANDHUB - lukis sempadan lot, jalan, sungai & label atas gambar
// aerial/drone penyenaraian. Setiap poligon lot dipaut ke rekod Lot (panel
// kanan menyunting rekod itu terus), jadi melukis dan mengisi maklumat lot
// berlaku di satu skrin.
//
// Pentas ialah SATU <svg>: gambar dan semua bentuk dalam koordinat piksel
// gambar di bawah satu <g> yang membawa zoom/pan/putar. Titik tetikus ditukar
// ke ruang gambar melalui getScreenCTM().inverse(), jadi putaran & zoom tak
// perlukan matematik tangan. Bentuk disimpan TERNORMAL 0..1 (lib/geran/penanda).

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import polygonClipping from "polygon-clipping";
import {
  Combine,
  Eye,
  EyeOff,
  Globe,
  Hexagon,
  ImageIcon,
  MapPin,
  Maximize,
  Maximize2,
  Minimize2,
  MousePointer2,
  PenLine,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  Spline,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { UNIT_KELUASAN_LABEL, formatRM } from "@/lib/geran";
import {
  LAPISAN,
  belahPoligon,
  buangSegaris,
  pusatPoligon,
  type Ciri,
  type Lapisan,
  type Penanda,
  type Pt,
} from "@/lib/geran/penanda";
import type { Titik } from "@/lib/geran/polygon";
import {
  SAIZ_KANVAS,
  ZUM_ASAS,
  dariDunia,
  keDunia,
  luasGeo,
  m2KeUnit,
  pusatGeo,
  type AsasPeta,
  JUBIN,
} from "@/lib/geran/peta";
import JubinPeta from "./JubinPeta";
import { LotFields, LotStatusBadge, STATUS_LOT, lotKosong } from "@/components/geran/admin/editor/lotShared";
import { INPUT, LABEL, type EditorForm, type LotForm, type UbahForm } from "@/components/geran/admin/editor/types";

type Alat = "pilih" | "edit" | "titik" | "garis" | "poligon" | "segiempat" | "belah" | "gabung";

const ALAT: { kunci: Alat; label: string; ikon: LucideIcon; kekunci: string; panduan: string }[] = [
  { kunci: "pilih", label: "Select", ikon: MousePointer2, kekunci: "V", panduan: "Click a shape to select it. Drag it to move, drag empty space to pan." },
  { kunci: "edit", label: "Edit points", ikon: PenLine, kekunci: "E", panduan: "Drag a corner to reshape. Click a midpoint to add a corner; double-click a corner to delete it." },
  { kunci: "titik", label: "Point", ikon: MapPin, kekunci: "P", panduan: "Click to drop a label pin." },
  { kunci: "garis", label: "Line", ikon: Spline, kekunci: "L", panduan: "Click to add points. Double-click or press Enter to finish." },
  { kunci: "poligon", label: "Polygon", ikon: Hexagon, kekunci: "G", panduan: "Click each corner of the lot. Click the first corner, double-click or press Enter to close." },
  { kunci: "segiempat", label: "Rectangle", ikon: Square, kekunci: "R", panduan: "Drag to draw a rectangular lot." },
  { kunci: "belah", label: "Split lot", ikon: Scissors, kekunci: "S", panduan: "Select a lot, then click two points on either side of it to cut it in two." },
  { kunci: "gabung", label: "Merge lots", ikon: Combine, kekunci: "M", panduan: "Select a lot, then click a touching lot to merge them into one." },
];

const WARNA_JALAN = "#FBBF24";
const WARNA_SUNGAI = "#38BDF8";
const WARNA_TAK_BERPAUT = "#E5E7EB";
const JARAK_TUTUP_PX = 12; // piksel skrin untuk kira klik sebagai "atas bucu pertama"

type Seret =
  | { jenis: "pan"; mula: Pt; asal: Pt }
  // dicatat: sejarah Undo direkod pada gerakan PERTAMA, bukan semasa tekan -
  // klik untuk memilih sahaja tak patut jadi langkah Undo kosong.
  | { jenis: "bucu"; id: string; idx: number; dicatat: boolean }
  | { jenis: "badan"; id: string; mula: Pt; asal: Titik[]; dicatat: boolean }
  | { jenis: "segiempat"; mula: Pt };

type Snap = { penanda: Penanda; penandaPeta: EditorForm["penandaPeta"]; lots: LotForm[] };

// Sumber "gambar" khas untuk peta satelit - disimpan dalam keadaan `url`
// supaya semua logik pilih/lukis/sejarah kekal sama untuk kedua-dua sumber.
const PETA = "__peta__";

let kiraanCiri = 0;
const idCiri = () => {
  kiraanCiri += 1;
  return `c-${Date.now().toString(36)}-${kiraanCiri}`;
};

function formatLuas(lot: LotForm) {
  return lot.keluasan ? `${lot.keluasan} ${UNIT_KELUASAN_LABEL[lot.unitKeluasan] ?? ""}` : null;
}

export default function LotMarker({ form, ubah }: { form: EditorForm; ubah: UbahForm }) {
  const urls = form.gambarUrls;
  const [url, setUrl] = useState<string | null>(urls[0] ?? PETA);
  const [asas, setAsas] = useState<AsasPeta>("satelit");
  const [dimensiDimuat, setDimensiDimuat] = useState<Record<string, { w: number; h: number }>>({});
  const [alat, setAlat] = useState<Alat>("pilih");
  const [lapisanGaris, setLapisanGaris] = useState<"jalan" | "sungai">("jalan");
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [draf, setDraf] = useState<Pt[]>([]);
  const [hover, setHover] = useState<Pt | null>(null);
  const [kotak, setKotak] = useState<[Pt, Pt] | null>(null);
  const [nampak, setNampak] = useState<Record<Lapisan, boolean>>({ lot: true, jalan: true, sungai: true, label: true });
  const [pandang, setPandang] = useState({ s: 1, tx: 0, ty: 0 });
  const [putar, setPutar] = useState(0);
  const [kelegapan, setKelegapan] = useState(1);
  const [layarPenuh, setLayarPenuh] = useState(false);
  const [mesej, setMesej] = useState<string | null>(null);
  const [, paksaRender] = useReducer((x: number) => x + 1, 0);

  const formRef = useRef(form);
  formRef.current = form;
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const bekasRef = useRef<HTMLDivElement>(null);
  const seretRef = useRef<Seret | null>(null);
  const undoRef = useRef<Snap[]>([]);
  const redoRef = useRef<Snap[]>([]);
  const [saizBekas, setSaizBekas] = useState({ w: 0, h: 0 });

  // Gambar dibuang dari tab Media semasa editor terbuka - jangan kekal atasnya.
  useEffect(() => {
    if (url && url !== PETA && !urls.includes(url)) setUrl(urls[0] ?? PETA);
  }, [url, urls]);

  const modPeta = url === PETA;

  // Asal kanvas peta (piksel dunia pada ZUM_ASAS) - DITETAPKAN sekali bila
  // masuk mod peta: pusat bentuk sedia ada, atau koordinat penyenaraian.
  // Kalau ia dikira semula setiap render, kanvas akan beranjak di tengah
  // seretan setiap kali bentuk berubah.
  const asalPetaRef = useRef<Pt | null>(null);
  const lokasiDiketahuiRef = useRef(true);
  if (modPeta && !asalPetaRef.current) {
    const semua = form.penandaPeta.ciri.flatMap((c) => c.points) as [number, number][];
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    let pusat: [number, number] | null = null;
    if (semua.length > 0) pusat = pusatGeo(semua);
    else if (form.latitude.trim() && form.longitude.trim() && Number.isFinite(lat) && Number.isFinite(lng)) pusat = [lng, lat];
    lokasiDiketahuiRef.current = !!pusat;
    const [px, py] = keDunia(...(pusat ?? ([101.9758, 4.2105] as [number, number])), ZUM_ASAS);
    asalPetaRef.current = [px - SAIZ_KANVAS / 2, py - SAIZ_KANVAS / 2];
  }
  const asalPeta = asalPetaRef.current ?? [0, 0];

  const entri = url && !modPeta ? form.penanda[url] : undefined;
  const dim = modPeta
    ? { w: SAIZ_KANVAS, h: SAIZ_KANVAS }
    : url
      ? entri
        ? { w: entri.w, h: entri.h }
        : dimensiDimuat[url]
      : undefined;
  const ciri = useMemo(
    () => (modPeta ? form.penandaPeta.ciri : entri?.ciri ?? []),
    [modPeta, form.penandaPeta, entri]
  );

  // Dimensi asal gambar - perlu untuk kanvas & overlay "cover" di laman awam.
  useEffect(() => {
    if (!url || dim || url === PETA) return;
    const img = new window.Image();
    img.onload = () => setDimensiDimuat((d) => ({ ...d, [url]: { w: img.naturalWidth, h: img.naturalHeight } }));
    img.src = url;
  }, [url, dim]);

  useEffect(() => {
    const el = bekasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSaizBekas({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const muatkan = useCallback(() => {
    // Bekas belum dibentang (lebar/tinggi 0) - skala 0 akan jadikan saiz
    // teks Infinity dan koordinat label NaN.
    if (!dim || saizBekas.w === 0 || saizBekas.h === 0) return;
    if (url === PETA) {
      // Peta: muatkan semua bentuk dengan ruang tepi, atau ~700 m sekeliling
      // lokasi penyenaraian bila belum ada apa-apa dilukis.
      const px = ciri.flatMap((c) => c.points.map((t) => kePx(t)));
      let [x1, y1, x2, y2] = [SAIZ_KANVAS / 2 - 600, SAIZ_KANVAS / 2 - 600, SAIZ_KANVAS / 2 + 600, SAIZ_KANVAS / 2 + 600];
      if (px.length > 0) {
        x1 = Math.min(...px.map((p) => p[0])) - 60;
        y1 = Math.min(...px.map((p) => p[1])) - 60;
        x2 = Math.max(...px.map((p) => p[0])) + 60;
        y2 = Math.max(...px.map((p) => p[1])) + 60;
      }
      const s = Math.min(saizBekas.w / (x2 - x1), saizBekas.h / (y2 - y1), 4);
      setPutar(0);
      setPandang({ s, tx: saizBekas.w / 2 - ((x1 + x2) / 2) * s, ty: saizBekas.h / 2 - ((y1 + y2) / 2) * s });
      return;
    }
    const sisi = putar % 180 === 0 ? { w: dim.w, h: dim.h } : { w: dim.h, h: dim.w };
    const s = Math.min(saizBekas.w / sisi.w, saizBekas.h / sisi.h) * 0.94;
    setPandang({ s, tx: (saizBekas.w - dim.w * s) / 2, ty: (saizBekas.h - dim.h * s) / 2 });
  }, [dim, saizBekas, putar, url, ciri]); // eslint-disable-line react-hooks/exhaustive-deps

  // Muat semula pandangan bila gambar, saiz bekas (cth. layar penuh) atau putaran berubah.
  useEffect(() => {
    muatkan();
  }, [url, dim?.w, dim?.h, saizBekas.w, saizBekas.h, putar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setDipilih(null);
    setDraf([]);
    setKotak(null);
  }, [url]);

  useEffect(() => {
    setDraf([]);
    setKotak(null);
  }, [alat]);

  useEffect(() => {
    if (!mesej) return;
    const t = setTimeout(() => setMesej(null), 3800);
    return () => clearTimeout(t);
  }, [mesej]);

  // ---------- Tulis & sejarah ----------

  function catatSejarah() {
    const f = formRef.current;
    undoRef.current.push({ penanda: f.penanda, penandaPeta: f.penandaPeta, lots: f.lots });
    if (undoRef.current.length > 100) undoRef.current.shift();
    redoRef.current = [];
    paksaRender();
  }

  function tulis(ciriBaru: Ciri[], lotsBaru?: LotForm[], sejarah = true) {
    if (!url || !dim) return;
    if (sejarah) catatSejarah();
    const f = formRef.current;
    if (url === PETA) {
      const penandaPeta = { ciri: ciriBaru };
      ubah(lotsBaru ? { penandaPeta, lots: lotsBaru } : { penandaPeta });
      return;
    }
    const penanda: Penanda = { ...f.penanda };
    if (ciriBaru.length === 0) delete penanda[url];
    else penanda[url] = { w: dim.w, h: dim.h, ciri: ciriBaru };
    ubah(lotsBaru ? { penanda, lots: lotsBaru } : { penanda });
  }

  function undo() {
    const snap = undoRef.current.pop();
    if (!snap) return;
    const f = formRef.current;
    redoRef.current.push({ penanda: f.penanda, penandaPeta: f.penandaPeta, lots: f.lots });
    ubah({ penanda: snap.penanda, penandaPeta: snap.penandaPeta, lots: snap.lots });
    paksaRender();
  }

  function redo() {
    const snap = redoRef.current.pop();
    if (!snap) return;
    const f = formRef.current;
    undoRef.current.push({ penanda: f.penanda, penandaPeta: f.penandaPeta, lots: f.lots });
    ubah({ penanda: snap.penanda, penandaPeta: snap.penandaPeta, lots: snap.lots });
    paksaRender();
  }

  // ---------- Penukaran koordinat ----------

  // Gambar: koordinat tersimpan ternormal 0..1. Peta: [lng, lat] sebenar,
  // ditukar ke piksel kanvas melalui piksel dunia Web Mercator.
  function kePx(t: Titik): Pt {
    if (modPeta) {
      const [x, y] = keDunia(t[0], t[1], ZUM_ASAS);
      return [x - asalPeta[0], y - asalPeta[1]];
    }
    return [t[0] * (dim?.w ?? 1), t[1] * (dim?.h ?? 1)];
  }
  function keNorm(p: Pt): Titik {
    if (modPeta) {
      const [lng, lat] = dariDunia(p[0] + asalPeta[0], p[1] + asalPeta[1], ZUM_ASAS);
      return [Math.round(lng * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7];
    }
    return [Math.round((p[0] / (dim?.w ?? 1)) * 1e5) / 1e5, Math.round((p[1] / (dim?.h ?? 1)) * 1e5) / 1e5];
  }

  // Luas poligon peta dalam unit lot (null untuk bentuk atas gambar - tiada skala).
  function luasDiukur(c: Ciri, unit: string): number | null {
    if (!modPeta || c.bentuk !== "poligon") return null;
    return Math.round(m2KeUnit(luasGeo(c.points as [number, number][]), unit) * 100) / 100;
  }

  function titikGambar(e: { clientX: number; clientY: number }): Pt {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return [0, 0];
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = g.getScreenCTM();
    if (!m) return [0, 0];
    const p = pt.matrixTransform(m.inverse());
    return [p.x, p.y];
  }

  function titikSkrin(e: { clientX: number; clientY: number }): Pt {
    const r = svgRef.current?.getBoundingClientRect();
    return r ? [e.clientX - r.left, e.clientY - r.top] : [0, 0];
  }

  function zum(faktor: number, pusat?: Pt) {
    setPandang((v) => {
      const s = Math.min(40, Math.max(0.05, v.s * faktor));
      const q = pusat ?? [saizBekas.w / 2, saizBekas.h / 2];
      return { s, tx: q[0] - ((q[0] - v.tx) * s) / v.s, ty: q[1] - ((q[1] - v.ty) * s) / v.s };
    });
  }

  // Roda tetikus mesti didaftar sebagai bukan-pasif supaya preventDefault
  // menghalang halaman ikut tatal semasa zum.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zum(e.deltaY < 0 ? 1.15 : 1 / 1.15, [e.clientX - r.left, e.clientY - r.top]);
    };
    svg.addEventListener("wheel", h, { passive: false });
    return () => svg.removeEventListener("wheel", h);
  }); // didaftar semula setiap render supaya `zum` nampak saizBekas terkini

  // ---------- Cipta bentuk ----------

  const lotIkutKunci = useMemo(() => new Map(form.lots.map((l) => [l.kunci, l])), [form.lots]);

  function ciptaLotPoligon(pointsPx: Pt[]) {
    const f = formRef.current;
    const lot = lotKosong(f);
    const c: Ciri = { id: idCiri(), lapisan: "lot", bentuk: "poligon", points: pointsPx.map(keNorm), lotId: lot.kunci };
    // Atas peta satelit kita tahu saiz sebenar - isi keluasan & koordinat
    // lot terus daripada lukisan.
    const luas = luasDiukur(c, lot.unitKeluasan);
    if (luas !== null) {
      const [lng, lat] = pusatGeo(c.points as [number, number][]);
      lot.keluasan = String(luas);
      lot.latitude = lat.toFixed(6);
      lot.longitude = lng.toFixed(6);
    }
    tulis([...ciri, c], [...f.lots, lot]);
    setDipilih(c.id);
    setMesej(`${lot.noLot} created — fill in its details on the right.`);
  }

  function tamatkanDraf() {
    if (alat === "poligon" && draf.length >= 3) ciptaLotPoligon(draf);
    else if (alat === "garis" && draf.length >= 2) {
      const c: Ciri = { id: idCiri(), lapisan: lapisanGaris, bentuk: "garis", points: draf.map(keNorm), label: null };
      tulis([...ciri, c]);
      setDipilih(c.id);
    }
    setDraf([]);
  }

  function belah(p1: Pt, p2: Pt) {
    const sasaran = ciri.find((c) => c.id === dipilih && c.bentuk === "poligon");
    if (!sasaran) {
      setMesej("Select a lot first, then draw the cut line across it.");
      return;
    }
    const hasil = belahPoligon(sasaran.points.map(kePx), p1, p2);
    if (!hasil) {
      setMesej("The cut line must cross the lot cleanly from one side to the other.");
      return;
    }
    const f = formRef.current;
    const lotBaru = lotKosong(f);
    const baru: Ciri = { id: idCiri(), lapisan: "lot", bentuk: "poligon", points: hasil[1].map(keNorm), lotId: lotBaru.kunci };
    tulis(
      [...ciri.map((c) => (c.id === sasaran.id ? { ...c, points: hasil[0].map(keNorm) } : c)), baru],
      [...f.lots, lotBaru]
    );
    setDipilih(baru.id);
    setMesej(`Lot split — the new part is ${lotBaru.noLot}.`);
  }

  function gabung(idB: string) {
    const a = ciri.find((c) => c.id === dipilih && c.bentuk === "poligon");
    const b = ciri.find((c) => c.id === idB && c.bentuk === "poligon");
    if (!a || !b || a.id === b.id) {
      setMesej("Select a lot first, then click a touching lot to merge into it.");
      return;
    }
    const cincin = (c: Ciri): [number, number][] => {
      const p = c.points.map(kePx);
      return [...p, p[0]];
    };
    const hasil = polygonClipping.union([cincin(a)], [cincin(b)]);
    if (hasil.length !== 1) {
      setMesej("These lots don't touch — move them together before merging.");
      return;
    }
    const luar = buangSegaris(hasil[0][0].slice(0, -1) as Pt[]);
    const lotB = b.lotId ? lotIkutKunci.get(b.lotId) : null;
    tulis(ciri.filter((c) => c.id !== b.id).map((c) => (c.id === a.id ? { ...c, points: luar.map(keNorm) } : c)));
    setMesej(
      lotB && lotB.kunci !== a.lotId
        ? `Merged. ${lotB.noLot} is no longer drawn — delete it in Lot List if it's no longer sold separately.`
        : "Lots merged."
    );
  }

  function padamDipilih() {
    if (!dipilih) return;
    tulis(ciri.filter((c) => c.id !== dipilih));
    setDipilih(null);
  }

  function padamBucu(id: string, idx: number) {
    const c = ciri.find((x) => x.id === id);
    if (!c) return;
    const min = c.bentuk === "poligon" ? 3 : 2;
    if (c.points.length <= min) {
      setMesej(`A ${c.bentuk === "poligon" ? "lot" : "line"} needs at least ${min} corners.`);
      return;
    }
    tulis(ciri.map((x) => (x.id === id ? { ...x, points: x.points.filter((_, i) => i !== idx) } : x)));
  }

  // ---------- Peristiwa penunjuk ----------

  function tekanPentas(e: React.PointerEvent<SVGSVGElement>) {
    if (!dim || e.button === 2) return;
    const p = titikGambar(e);
    // Butang tengah atau Space+seret sentiasa pan, walau alat apa pun.
    if (e.button === 1 || alat === "pilih" || alat === "edit" || alat === "gabung") {
      if (alat !== "gabung" && e.button === 0) setDipilih(null);
      seretRef.current = { jenis: "pan", mula: titikSkrin(e), asal: [pandang.tx, pandang.ty] };
      svgRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (alat === "titik") {
      const c: Ciri = { id: idCiri(), lapisan: "label", bentuk: "titik", points: [keNorm(p)], label: "" };
      tulis([...ciri, c]);
      setDipilih(c.id);
      return;
    }
    if (alat === "segiempat") {
      seretRef.current = { jenis: "segiempat", mula: p };
      setKotak([p, p]);
      svgRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (alat === "poligon") {
      if (draf.length >= 3) {
        const pertama = draf[0];
        const jarak = Math.hypot(p[0] - pertama[0], p[1] - pertama[1]) * pandang.s;
        if (jarak < JARAK_TUTUP_PX) {
          ciptaLotPoligon(draf);
          setDraf([]);
          return;
        }
      }
      setDraf((d) => [...d, p]);
      return;
    }
    if (alat === "garis") {
      setDraf((d) => [...d, p]);
      return;
    }
    if (alat === "belah") {
      if (draf.length === 0) setDraf([p]);
      else {
        belah(draf[0], p);
        setDraf([]);
      }
    }
  }

  function tekanCiri(e: React.PointerEvent, c: Ciri) {
    if (e.button !== 0) return;
    if (alat === "gabung") {
      e.stopPropagation();
      if (!dipilih || dipilih === c.id) setDipilih(c.id);
      else gabung(c.id);
      return;
    }
    if (alat === "belah" && draf.length === 0 && c.bentuk === "poligon" && dipilih !== c.id) {
      e.stopPropagation();
      setDipilih(c.id);
      return;
    }
    if (alat !== "pilih" && alat !== "edit") return; // alat melukis: klik jatuh ke pentas
    e.stopPropagation();
    setDipilih(c.id);
    if (alat === "pilih") {
      seretRef.current = { jenis: "badan", id: c.id, mula: titikGambar(e), asal: c.points, dicatat: false };
      svgRef.current?.setPointerCapture(e.pointerId);
    }
  }

  function tekanBucu(e: React.PointerEvent, id: string, idx: number) {
    e.stopPropagation();
    if (e.button !== 0) return;
    seretRef.current = { jenis: "bucu", id, idx, dicatat: false };
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function tekanTengah(e: React.PointerEvent, c: Ciri, idx: number) {
    // Klik titik tengah tepi = sisip bucu baru di situ dan terus seret.
    e.stopPropagation();
    catatSejarah();
    const a = c.points[idx];
    const b = c.points[(idx + 1) % c.points.length];
    const baru: Titik = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const points = [...c.points.slice(0, idx + 1), baru, ...c.points.slice(idx + 1)];
    tulis(
      ciri.map((x) => (x.id === c.id ? { ...x, points } : x)),
      undefined,
      false
    );
    seretRef.current = { jenis: "bucu", id: c.id, idx: idx + 1, dicatat: true };
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function gerakPentas(e: React.PointerEvent<SVGSVGElement>) {
    const s = seretRef.current;
    if (!s) {
      if (draf.length > 0) setHover(titikGambar(e));
      return;
    }
    if (s.jenis === "pan") {
      const q = titikSkrin(e);
      setPandang((v) => ({ ...v, tx: s.asal[0] + q[0] - s.mula[0], ty: s.asal[1] + q[1] - s.mula[1] }));
      return;
    }
    const p = titikGambar(e);
    if (s.jenis === "segiempat") {
      setKotak([s.mula, p]);
      return;
    }
    if ((s.jenis === "bucu" || s.jenis === "badan") && !s.dicatat) {
      catatSejarah();
      s.dicatat = true;
    }
    if (s.jenis === "bucu") {
      const baru = keNorm(p);
      tulis(
        ciri.map((c) => (c.id === s.id ? { ...c, points: c.points.map((t, i) => (i === s.idx ? baru : t)) } : c)),
        undefined,
        false
      );
      return;
    }
    if (s.jenis === "badan") {
      const dx = (p[0] - s.mula[0]) / (dim?.w ?? 1);
      const dy = (p[1] - s.mula[1]) / (dim?.h ?? 1);
      tulis(
        ciri.map((c) => (c.id === s.id ? { ...c, points: s.asal.map(([x, y]) => [x + dx, y + dy] as Titik) } : c)),
        undefined,
        false
      );
    }
  }

  function lepasPentas() {
    const s = seretRef.current;
    seretRef.current = null;
    if (s?.jenis === "segiempat" && kotak) {
      const [[x1, y1], [x2, y2]] = kotak;
      setKotak(null);
      if (Math.abs(x2 - x1) * pandang.s < 8 || Math.abs(y2 - y1) * pandang.s < 8) return;
      ciptaLotPoligon([
        [Math.min(x1, x2), Math.min(y1, y2)],
        [Math.max(x1, x2), Math.min(y1, y2)],
        [Math.max(x1, x2), Math.max(y1, y2)],
        [Math.min(x1, x2), Math.max(y1, y2)],
      ]);
    }
  }

  // ---------- Papan kekunci ----------

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const kawalan = e.ctrlKey || e.metaKey;
      if (kawalan && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (kawalan && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (kawalan) return;
      if (e.key === "Enter") tamatkanDraf();
      else if (e.key === "Escape") {
        if (draf.length > 0) setDraf([]);
        else if (dipilih) setDipilih(null);
        else if (layarPenuh) setLayarPenuh(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && dipilih) {
        e.preventDefault();
        padamDipilih();
      } else {
        const a = ALAT.find((x) => x.kekunci.toLowerCase() === e.key.toLowerCase());
        if (a) setAlat(a.kunci);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ---------- Paparan ----------

  const ciriDipilih = ciri.find((c) => c.id === dipilih) ?? null;
  const lotDipilih = ciriDipilih?.lotId ? lotIkutKunci.get(ciriDipilih.lotId) ?? null : null;
  const s = pandang.s;
  const saizTeks = 12.5 / s;

  function warnaLot(c: Ciri) {
    const lot = c.lotId ? lotIkutKunci.get(c.lotId) : null;
    return lot ? STATUS_LOT[lot.status].hex : WARNA_TAK_BERPAUT;
  }

  function lukisCiri(c: Ciri) {
    if (!nampak[c.lapisan]) return null;
    const px = c.points.map(kePx);
    const aktif = c.id === dipilih;
    const senarai = px.map((p) => p.join(",")).join(" ");
    const kursor = alat === "pilih" ? "move" : alat === "edit" || alat === "gabung" || alat === "belah" ? "pointer" : undefined;

    if (c.bentuk === "poligon") {
      const warna = warnaLot(c);
      const lot = c.lotId ? lotIkutKunci.get(c.lotId) : null;
      const [cx, cy] = pusatPoligon(px);
      const baris = lot
        ? [lot.noLot, formatLuas(lot), lot.hargaRM ? formatRM(Math.round(Number(lot.hargaRM) * 100)) : null].filter(Boolean)
        : ["Not linked"];
      return (
        <g key={c.id} onPointerDown={(e) => tekanCiri(e, c)} style={{ cursor: kursor }}>
          <polygon
            points={senarai}
            fill={warna}
            fillOpacity={aktif ? 0.42 : 0.3}
            stroke={aktif ? "#FFFFFF" : warna}
            strokeWidth={aktif ? 3 : 2}
            strokeDasharray={lot ? undefined : "6 4"}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {nampak.label && (
            <text
              x={cx}
              y={cy - ((baris.length - 1) * saizTeks * 1.25) / 2}
              textAnchor="middle"
              fontSize={saizTeks}
              fontWeight={700}
              fill="#fff"
              stroke="rgba(0,0,0,0.7)"
              strokeWidth={saizTeks * 0.22}
              paintOrder="stroke"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {baris.map((b, i) => (
                <tspan key={i} x={cx} dy={i === 0 ? 0 : saizTeks * 1.25} fontWeight={i === 0 ? 800 : 600}>
                  {b}
                </tspan>
              ))}
            </text>
          )}
        </g>
      );
    }

    if (c.bentuk === "garis") {
      const warna = c.lapisan === "sungai" ? WARNA_SUNGAI : WARNA_JALAN;
      const [lx, ly] = px[Math.floor(px.length / 2)];
      return (
        <g key={c.id} onPointerDown={(e) => tekanCiri(e, c)} style={{ cursor: kursor }}>
          {/* Garis lebar lutsinar = kawasan klik yang mudah disasar. */}
          <polyline points={senarai} fill="none" stroke="transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" />
          <polyline points={senarai} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={aktif ? 8 : 7} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <polyline points={senarai} fill="none" stroke={aktif ? "#FFFFFF" : warna} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {nampak.label && c.label && (
            <text x={lx} y={ly - 8 / s} textAnchor="middle" fontSize={saizTeks} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,0.7)" strokeWidth={saizTeks * 0.22} paintOrder="stroke" style={{ pointerEvents: "none" }}>
              {c.label}
            </text>
          )}
        </g>
      );
    }

    const [x, y] = px[0];
    return (
      <g key={c.id} onPointerDown={(e) => tekanCiri(e, c)} style={{ cursor: kursor }}>
        <circle cx={x} cy={y} r={7 / s} fill={aktif ? "#10B981" : "#fff"} stroke="#0B2A1F" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <circle cx={x} cy={y} r={2.5 / s} fill="#0B2A1F" />
        {c.label && (
          <text x={x + 11 / s} y={y + 4 / s} fontSize={saizTeks} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,0.7)" strokeWidth={saizTeks * 0.22} paintOrder="stroke" style={{ pointerEvents: "none" }}>
            {c.label}
          </text>
        )}
      </g>
    );
  }

  function lukisPemegang() {
    if (!ciriDipilih || !nampak[ciriDipilih.lapisan] || ciriDipilih.bentuk === "titik") return null;
    const px = ciriDipilih.points.map(kePx);
    const tertutup = ciriDipilih.bentuk === "poligon";
    const r = 5.5 / s;
    return (
      <g>
        {alat === "edit" &&
          px.map((p, i) => {
            if (!tertutup && i === px.length - 1) return null;
            const q = px[(i + 1) % px.length];
            return (
              <rect
                key={`m${i}`}
                x={(p[0] + q[0]) / 2 - r * 0.7}
                y={(p[1] + q[1]) / 2 - r * 0.7}
                width={r * 1.4}
                height={r * 1.4}
                fill="rgba(255,255,255,0.75)"
                stroke="#0B2A1F"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                style={{ cursor: "copy" }}
                onPointerDown={(e) => tekanTengah(e, ciriDipilih, i)}
              />
            );
          })}
        {px.map((p, i) => (
          <circle
            key={`b${i}`}
            cx={p[0]}
            cy={p[1]}
            r={r}
            fill="#fff"
            stroke="#059669"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            style={{ cursor: alat === "edit" ? "grab" : "default", pointerEvents: alat === "edit" ? "auto" : "none" }}
            onPointerDown={(e) => tekanBucu(e, ciriDipilih.id, i)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              padamBucu(ciriDipilih.id, i);
            }}
          />
        ))}
      </g>
    );
  }

  function lukisDraf() {
    if (kotak) {
      const [[x1, y1], [x2, y2]] = kotak;
      return (
        <rect
          x={Math.min(x1, x2)}
          y={Math.min(y1, y2)}
          width={Math.abs(x2 - x1)}
          height={Math.abs(y2 - y1)}
          fill="rgba(16,185,129,0.2)"
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    if (draf.length === 0) return null;
    const semua = hover ? [...draf, hover] : draf;
    const warna = alat === "belah" ? "#F43F5E" : alat === "garis" ? (lapisanGaris === "sungai" ? WARNA_SUNGAI : WARNA_JALAN) : "#10B981";
    return (
      <g style={{ pointerEvents: "none" }}>
        {alat === "poligon" && draf.length >= 2 && (
          <polygon points={semua.map((p) => p.join(",")).join(" ")} fill="rgba(16,185,129,0.18)" stroke="none" />
        )}
        <polyline
          points={semua.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke={warna}
          strokeWidth={2.5}
          strokeDasharray={alat === "belah" ? "8 5" : undefined}
          vectorEffect="non-scaling-stroke"
        />
        {draf.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={(i === 0 && alat === "poligon" ? 7 : 4.5) / s} fill={i === 0 ? warna : "#fff"} stroke={warna} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    );
  }

  // ---------- Panel ----------

  // sejarah=false untuk medan teks: satu langkah Undo setiap huruf yang
  // ditaip tak berguna kepada sesiapa.
  function ubahCiri(p: Partial<Ciri>, sejarah = true) {
    if (!ciriDipilih) return;
    tulis(ciri.map((c) => (c.id === ciriDipilih.id ? { ...c, ...p } : c)), undefined, sejarah);
  }

  function ubahLotDipilih(p: Partial<LotForm>) {
    if (!lotDipilih) return;
    ubah({ lots: formRef.current.lots.map((l) => (l.kunci === lotDipilih.kunci ? { ...l, ...p } : l)) });
  }

  function pautLot(nilai: string) {
    if (!ciriDipilih) return;
    if (nilai === "__baru") {
      const f = formRef.current;
      const lot = lotKosong(f);
      tulis(
        ciri.map((c) => (c.id === ciriDipilih.id ? { ...c, lotId: lot.kunci } : c)),
        [...f.lots, lot]
      );
      return;
    }
    ubahCiri({ lotId: nilai || null });
  }

  const alatAktif = ALAT.find((a) => a.kunci === alat)!;
  const kiraLapisan = (l: Lapisan) => ciri.filter((c) => c.lapisan === l).length;
  const lotTakDilukis = form.lots.filter(
    (l) =>
      !Object.values(form.penanda).some((e) => e.ciri.some((c) => c.lotId === l.kunci)) &&
      !form.penandaPeta.ciri.some((c) => c.lotId === l.kunci)
  );

  const PANEL = "bg-white rounded-2xl border border-black/[0.06]";

  return (
    <div className={layarPenuh ? "fixed inset-0 z-[70] bg-[#EEF1EF] p-3 space-y-3 overflow-y-auto" : "space-y-3"}>
      {/* Bar atas: pilih gambar, putar, kelegapan, layar penuh */}
      <div className={`${PANEL} px-3 py-2 flex flex-wrap items-center gap-3`}>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setUrl(PETA)}
            title="Draw on the satellite map"
            className={`relative h-10 px-3 rounded-md shrink-0 border-2 inline-flex items-center gap-1.5 text-xs font-bold ${
              modPeta ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-black/[0.08] text-black/60 hover:bg-black/[0.03]"
            }`}
          >
            <Globe size={15} /> Satellite
            {form.penandaPeta.ciri.length > 0 && (
              <span className="rounded bg-black/70 px-1 text-[9px] font-bold text-white">{form.penandaPeta.ciri.length}</span>
            )}
          </button>
          {urls.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrl(u)}
              title={`Photo ${i + 1}`}
              className={`relative w-14 h-10 rounded-md overflow-hidden shrink-0 border-2 ${u === url ? "border-emerald-600" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" />
              {(form.penanda[u]?.ciri.length ?? 0) > 0 && (
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                  {form.penanda[u].ciri.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm">
          <button type="button" onClick={() => setPutar((r) => (r + 270) % 360)} className="p-2 rounded-md hover:bg-black/5" title="Rotate left">
            <RotateCcw size={16} />
          </button>
          <button type="button" onClick={() => setPutar((r) => (r + 90) % 360)} className="p-2 rounded-md hover:bg-black/5" title="Rotate right">
            <RotateCw size={16} />
          </button>
          <label className="flex items-center gap-2 pl-2 text-xs text-black/55" title="Photo opacity">
            <ImageIcon size={15} />
            <input type="range" min={0.2} max={1} step={0.05} value={kelegapan} onChange={(e) => setKelegapan(Number(e.target.value))} className="w-20 accent-emerald-700" />
          </label>
          <button
            type="button"
            onClick={() => setLayarPenuh((v) => !v)}
            className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-black/[0.1] px-2.5 py-1.5 text-xs font-semibold hover:bg-black/[0.03]"
          >
            {layarPenuh ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {layarPenuh ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </div>

      {/* Tiga lajur hanya bila cukup lebar; di skrin sempit alat jadi bar ikon
          di atas dan panel lot turun ke bawah kanvas, supaya kanvas tak terhimpit. */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[168px_minmax(0,1fr)] xl:grid-cols-[168px_minmax(0,1fr)_300px]">
        {/* Alat & lapisan */}
        <div className={`${PANEL} p-2.5 self-start`}>
          <p className="px-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">Tools</p>
          <div className="grid grid-cols-8 lg:grid-cols-1 gap-0.5">
            {ALAT.map((a) => (
              <button
                key={a.kunci}
                type="button"
                onClick={() => setAlat(a.kunci)}
                title={`${a.label} (${a.kekunci})`}
                className={`flex items-center justify-center lg:justify-start gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                  alat === a.kunci ? "bg-emerald-600/10 text-emerald-800 font-semibold" : "text-black/65 hover:bg-black/[0.04]"
                }`}
              >
                <a.ikon size={16} />
                <span className="hidden lg:inline flex-1 text-left">{a.label}</span>
                <kbd className="hidden lg:inline text-[10px] text-black/30 font-sans">{a.kekunci}</kbd>
              </button>
            ))}
          </div>
          {alat === "garis" && (
            <div className="mt-2 flex rounded-lg bg-black/[0.04] p-0.5 text-xs font-semibold">
              {(["jalan", "sungai"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLapisanGaris(l)}
                  className={`flex-1 rounded-md py-1 ${lapisanGaris === l ? "bg-white shadow-sm" : "text-black/50"}`}
                >
                  {LAPISAN[l].label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1 mt-2 pt-2 border-t border-black/[0.06]">
            <button type="button" onClick={undo} disabled={undoRef.current.length === 0} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-black/65 hover:bg-black/[0.04] disabled:opacity-30" title="Undo (Ctrl+Z)">
              <Undo2 size={15} /> Undo
            </button>
            <button type="button" onClick={redo} disabled={redoRef.current.length === 0} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-black/65 hover:bg-black/[0.04] disabled:opacity-30" title="Redo (Ctrl+Y)">
              <Redo2 size={15} /> Redo
            </button>
          </div>

          <p className="px-1.5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">Layers</p>
          <div className="flex flex-wrap gap-1 lg:block">
          {(Object.keys(LAPISAN) as Lapisan[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setNampak((n) => ({ ...n, [l]: !n[l] }))}
              className="lg:w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-black/65 hover:bg-black/[0.04]"
            >
              {nampak[l] ? <Eye size={15} className="text-emerald-700" /> : <EyeOff size={15} className="text-black/30" />}
              <span className={`flex-1 text-left ${nampak[l] ? "" : "text-black/35"}`}>{LAPISAN[l].label}</span>
              <span className="text-[11px] text-black/35">{kiraLapisan(l)}</span>
            </button>
          ))}
          </div>

          <p className="hidden lg:block px-1.5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">Lot status</p>
          <div className="hidden lg:block px-2 space-y-1 text-[12px] text-black/60">
            {Object.values(STATUS_LOT).map((st) => (
              <p key={st.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: st.hex }} /> {st.label}
              </p>
            ))}
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm border border-dashed border-black/40" /> Not linked
            </p>
          </div>
        </div>

        {/* Pentas */}
        <div className={`${PANEL} overflow-hidden flex flex-col min-w-0`}>
          <div
            ref={bekasRef}
            className={`relative bg-[#1F2A24] ${layarPenuh ? "h-[70vh] lg:h-[calc(100vh-150px)]" : "h-[440px] sm:h-[520px] lg:h-[600px]"}`}
          >
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full touch-none select-none"
              style={{
                cursor:
                  seretRef.current?.jenis === "pan"
                    ? "grabbing"
                    : alat === "pilih" || alat === "edit" || alat === "gabung"
                      ? "grab"
                      : "crosshair",
              }}
              onPointerDown={tekanPentas}
              onPointerMove={gerakPentas}
              onPointerUp={lepasPentas}
              onPointerLeave={() => setHover(null)}
              onDoubleClick={() => (alat === "poligon" || alat === "garis") && tamatkanDraf()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {dim && url && (
                <g ref={gRef} transform={`translate(${pandang.tx} ${pandang.ty}) scale(${s}) rotate(${putar} ${dim.w / 2} ${dim.h / 2})`}>
                  {modPeta ? (
                    <JubinPeta
                      asal={asalPeta}
                      pandang={pandang}
                      putar={putar}
                      saiz={{ w: saizBekas.w, h: saizBekas.h, kanvas: SAIZ_KANVAS }}
                      asas={asas}
                      kelegapan={kelegapan}
                    />
                  ) : (
                    <image href={url} width={dim.w} height={dim.h} opacity={kelegapan} preserveAspectRatio="none" />
                  )}
                  {ciri.filter((c) => c.bentuk === "poligon").map(lukisCiri)}
                  {ciri.filter((c) => c.bentuk === "garis").map(lukisCiri)}
                  {ciri.filter((c) => c.bentuk === "titik").map(lukisCiri)}
                  {lukisPemegang()}
                  {lukisDraf()}
                </g>
              )}
            </svg>

            {!dim && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/60">Loading photo…</p>}
            {modPeta && !lokasiDiketahuiRef.current && form.penandaPeta.ciri.length === 0 && (
              <div className="absolute inset-x-3 bottom-14 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                This listing has no coordinates yet, so the map starts at the centre of Malaysia. Add the latitude &amp;
                longitude in the <strong>General</strong> tab, save, and reopen this tab to jump straight to the land.
              </div>
            )}

            <div className="absolute top-3 left-3 right-3 flex justify-between gap-3 pointer-events-none">
              <p className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/90 max-w-md backdrop-blur-sm">
                <strong className="text-white">{alatAktif.label}:</strong> {alatAktif.panduan}
              </p>
            </div>
            {mesej && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-lg" role="status">
                {mesej}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 border-t border-black/[0.06] px-3 py-2 text-sm">
            <button type="button" onClick={() => zum(1 / 1.25)} className="p-1.5 rounded-md hover:bg-black/5" title="Zoom out">
              <ZoomOut size={16} />
            </button>
            <span className="w-14 text-center tabular-nums text-xs text-black/60">{Math.round(s * 100)}%</span>
            <button type="button" onClick={() => zum(1.25)} className="p-1.5 rounded-md hover:bg-black/5" title="Zoom in">
              <ZoomIn size={16} />
            </button>
            <button type="button" onClick={muatkan} className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-black/5">
              <Maximize size={14} /> Fit
            </button>
            {modPeta && (
              <div className="ml-2 flex rounded-md bg-black/[0.05] p-0.5 text-xs font-semibold">
                {(["satelit", "peta"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAsas(a)}
                    className={`rounded px-2.5 py-1 ${asas === a ? "bg-white shadow-sm" : "text-black/50"}`}
                  >
                    {a === "satelit" ? "Satellite" : "Map"}
                  </button>
                ))}
              </div>
            )}
            {draf.length > 0 && (alat === "poligon" || alat === "garis") && (
              <button type="button" onClick={tamatkanDraf} className="ml-auto rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                Finish shape (Enter)
              </button>
            )}
            <span className={`${draf.length > 0 ? "" : "ml-auto"} text-xs text-black/40 hidden sm:inline`}>
              {modPeta ? JUBIN[asas].atribusi : "Scroll to zoom · drag to pan"}
            </span>
          </div>
        </div>

        {/* Panel bentuk / lot */}
        <div className={`${PANEL} p-4 self-start min-w-0 overflow-x-hidden lg:col-span-2 xl:col-span-1 ${layarPenuh ? "xl:max-h-[calc(100vh-110px)] xl:overflow-y-auto" : ""}`}>
          {ciriDipilih ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">
                  {ciriDipilih.lapisan === "lot" ? "Lot shape" : `${LAPISAN[ciriDipilih.lapisan].label} ${ciriDipilih.bentuk === "titik" ? "pin" : "line"}`}
                </p>
                <button type="button" onClick={padamDipilih} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" title="Delete shape (Del)">
                  <Trash2 size={13} /> Delete shape
                </button>
              </div>

              {ciriDipilih.lapisan === "lot" ? (
                <>
                  <label className="block mb-4">
                    <span className={LABEL}>Linked lot</span>
                    <select value={ciriDipilih.lotId ?? ""} onChange={(e) => pautLot(e.target.value)} className={INPUT}>
                      <option value="">— Not linked —</option>
                      {form.lots.map((l) => (
                        <option key={l.kunci} value={l.kunci}>
                          {l.noLot || "Untitled lot"}
                        </option>
                      ))}
                      <option value="__baru">+ Create new lot</option>
                    </select>
                  </label>
                  {lotDipilih ? (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-display text-lg font-extrabold truncate">{lotDipilih.noLot || "Untitled lot"}</h3>
                        <LotStatusBadge status={lotDipilih.status} />
                      </div>
                      {(() => {
                        const luas = luasDiukur(ciriDipilih, lotDipilih.unitKeluasan);
                        if (luas === null) return null;
                        const sama = Number(lotDipilih.keluasan) === luas;
                        const [lng, lat] = pusatGeo(ciriDipilih.points as [number, number][]);
                        return (
                          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                            <span>
                              Measured on map: <strong>{luas.toLocaleString("en-MY")} {UNIT_KELUASAN_LABEL[lotDipilih.unitKeluasan]}</strong>
                            </span>
                            {!sama && (
                              <button
                                type="button"
                                onClick={() =>
                                  ubahLotDipilih({ keluasan: String(luas), latitude: lat.toFixed(6), longitude: lng.toFixed(6) })
                                }
                                className="rounded-md bg-emerald-700 px-2 py-1 font-bold text-white"
                              >
                                Use
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      <LotFields lot={lotDipilih} ubahLot={ubahLotDipilih} padat />
                    </>
                  ) : (
                    <p className="text-sm text-black/50">Link this shape to a lot so buyers see its number, price and status.</p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {ciriDipilih.bentuk === "garis" && (
                    <label className="block">
                      <span className={LABEL}>Type</span>
                      <select value={ciriDipilih.lapisan} onChange={(e) => ubahCiri({ lapisan: e.target.value as Lapisan })} className={INPUT}>
                        <option value="jalan">Road</option>
                        <option value="sungai">River</option>
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <span className={LABEL}>Label</span>
                    <input
                      autoFocus={ciriDipilih.bentuk === "titik"}
                      value={ciriDipilih.label ?? ""}
                      onChange={(e) => ubahCiri({ label: e.target.value }, false)}
                      placeholder={ciriDipilih.bentuk === "titik" ? "e.g. Main entrance" : "e.g. Jalan Utama"}
                      className={INPUT}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40 mb-2">On this photo</p>
              {ciri.length === 0 ? (
                <p className="text-sm text-black/50">
                  Nothing drawn yet. Pick <strong>Polygon</strong> or <strong>Rectangle</strong> and outline the first lot.
                </p>
              ) : (
                <ul className="space-y-1">
                  {ciri.map((c) => {
                    const lot = c.lotId ? lotIkutKunci.get(c.lotId) : null;
                    const warna = c.bentuk === "poligon" ? warnaLot(c) : c.lapisan === "sungai" ? WARNA_SUNGAI : c.lapisan === "jalan" ? WARNA_JALAN : "#0B2A1F";
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setDipilih(c.id)}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/[0.04] text-left"
                        >
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: warna }} />
                          <span className="flex-1 truncate">
                            {c.lapisan === "lot" ? lot?.noLot || "Unlinked lot shape" : c.label || LAPISAN[c.lapisan].label}
                          </span>
                          {lot && <span className="text-[11px] text-black/40">{STATUS_LOT[lot.status].label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {lotTakDilukis.length > 0 && (
                <div className="mt-4 pt-3 border-t border-black/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40 mb-1.5">Not drawn on any photo</p>
                  <p className="text-xs text-black/50">{lotTakDilukis.map((l) => l.noLot || "Untitled").join(", ")}</p>
                  <p className="text-xs text-black/40 mt-1">Draw a shape, then pick the lot under &ldquo;Linked lot&rdquo;.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
