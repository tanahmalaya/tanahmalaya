// Overlay Lot Marker untuk halaman AWAM - lot (diwarnakan ikut status),
// jalan, sungai & label dilukis atas gambar pada masa render daripada
// koordinat ternormal yang admin simpan (lib/geran/penanda.ts).
//
// preserveAspectRatio mesti sepadan dengan cara gambar dimuatkan ke bekasnya:
// galeri guna object-cover, jadi "slice" - SVG memangkas betul-betul serentak
// dengan gambar, dan bentuk kekal atas tanah yang sama pada semua saiz skrin.

import type { CiriAwam } from "@/lib/geran/penanda";

function pusat(p: [number, number][]): [number, number] {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-9) return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  return [cx / (3 * a), cy / (3 * a)];
}

export default function PenandaOverlay({ ciri, w, h }: { ciri: CiriAwam[]; w: number; h: number }) {
  if (ciri.length === 0) return null;
  const saizTeks = Math.max(10, h * 0.032);
  const teks = (x: number, y: number, isi: string, anchor: "middle" | "start" = "middle") => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={saizTeks}
      fontWeight={700}
      fill="#FFFFFF"
      stroke="rgba(0,0,0,0.65)"
      strokeWidth={saizTeks * 0.18}
      paintOrder="stroke"
    >
      {isi}
    </text>
  );

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {ciri
        .filter((c) => c.bentuk === "poligon")
        .map((c) => {
          const px = c.points.map(([x, y]) => [x * w, y * h] as [number, number]);
          const [cx, cy] = pusat(px);
          return (
            <g key={c.id}>
              <polygon
                points={px.map((p) => p.join(",")).join(" ")}
                fill={c.warna}
                fillOpacity={0.28}
                stroke={c.warna}
                strokeWidth={2.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
              />
              {c.label && teks(cx, cy, c.label)}
            </g>
          );
        })}
      {ciri
        .filter((c) => c.bentuk === "garis")
        .map((c) => {
          const px = c.points.map(([x, y]) => [x * w, y * h] as [number, number]);
          const senarai = px.map((p) => p.join(",")).join(" ");
          const tengah = px[Math.floor(px.length / 2)];
          return (
            <g key={c.id}>
              <polyline points={senarai} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <polyline points={senarai} fill="none" stroke={c.warna} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {c.label && teks(tengah[0], tengah[1] - saizTeks, c.label)}
            </g>
          );
        })}
      {ciri
        .filter((c) => c.bentuk === "titik")
        .map((c) => {
          const [x, y] = [c.points[0][0] * w, c.points[0][1] * h];
          return (
            <g key={c.id}>
              <circle cx={x} cy={y} r={saizTeks * 0.45} fill="#FFFFFF" stroke="#0E3B2E" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              {c.label && teks(x + saizTeks * 0.8, y, c.label, "start")}
            </g>
          );
        })}
    </svg>
  );
}
