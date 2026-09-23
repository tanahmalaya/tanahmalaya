"use client";

// Latar peta untuk Lot Marker - jubin satelit/peta dilukis sebagai <image> SVG
// dalam ruang piksel kanvas yang sama dengan bentuk lot, jadi zum, pan &
// lukisan berfungsi persis seperti atas gambar drone.
//
// Hanya jubin yang kelihatan dimuat. Aras zum jubin dipilih ikut skala
// paparan: zum masuk = jubin lebih terperinci, zum keluar = jubin lebih kasar,
// supaya bilangan jubin kekal kecil (~20-40) pada semua skala.

import { JUBIN, ZUM_ASAS, ZUM_JUBIN_MAKS, type AsasPeta } from "@/lib/geran/peta";

const MAKS_JUBIN = 160;

export default function JubinPeta({
  asal,
  pandang,
  putar,
  saiz,
  asas,
  kelegapan,
}: {
  asal: [number, number]; // piksel dunia (ZUM_ASAS) bagi titik (0,0) kanvas
  pandang: { s: number; tx: number; ty: number };
  putar: number;
  saiz: { w: number; h: number; kanvas: number };
  asas: AsasPeta;
  kelegapan: number;
}) {
  if (saiz.w === 0) return null;

  // Kotak kanvas yang kelihatan: songsangkan transform setiap bucu skrin.
  // Transform: skrin = t + s * (R(p - c) + c), c = pusat kanvas.
  const c = saiz.kanvas / 2;
  const rad = (-putar * Math.PI) / 180;
  const [kos, sin] = [Math.cos(rad), Math.sin(rad)];
  const bucu = [
    [0, 0],
    [saiz.w, 0],
    [0, saiz.h],
    [saiz.w, saiz.h],
  ].map(([x, y]) => {
    const qx = (x - pandang.tx) / pandang.s - c;
    const qy = (y - pandang.ty) / pandang.s - c;
    return [qx * kos - qy * sin + c, qx * sin + qy * kos + c];
  });
  const minX = Math.min(...bucu.map((b) => b[0]));
  const maxX = Math.max(...bucu.map((b) => b[0]));
  const minY = Math.min(...bucu.map((b) => b[1]));
  const maxY = Math.max(...bucu.map((b) => b[1]));

  const zum = Math.max(3, Math.min(ZUM_JUBIN_MAKS, Math.round(ZUM_ASAS + Math.log2(pandang.s))));
  const f = 2 ** (ZUM_ASAS - zum); // piksel kanvas bagi setiap piksel jubin
  const saizJubin = 256 * f;
  const had = 2 ** zum;

  const x0 = Math.floor((asal[0] + minX) / saizJubin);
  const x1 = Math.floor((asal[0] + maxX) / saizJubin);
  const y0 = Math.max(0, Math.floor((asal[1] + minY) / saizJubin));
  const y1 = Math.min(had - 1, Math.floor((asal[1] + maxY) / saizJubin));

  const jubin: { k: string; x: number; y: number; url: string }[] = [];
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (jubin.length >= MAKS_JUBIN) break;
      const txBalut = ((tx % had) + had) % had; // lintasan garis tarikh antarabangsa
      jubin.push({
        k: `${zum}/${tx}/${ty}`,
        x: tx * saizJubin - asal[0],
        y: ty * saizJubin - asal[1],
        url: JUBIN[asas].url(zum, txBalut, ty),
      });
    }
  }

  return (
    <g opacity={kelegapan}>
      {jubin.map((j) => (
        // Lebar +0.5 piksel skrin menutup garis rambut antara jubin bila zum
        // bukan gandaan tepat 2.
        <image
          key={j.k}
          href={j.url}
          x={j.x}
          y={j.y}
          width={saizJubin + 0.5 / pandang.s}
          height={saizJubin + 0.5 / pandang.s}
          preserveAspectRatio="none"
        />
      ))}
    </g>
  );
}
