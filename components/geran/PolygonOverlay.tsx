// Overlay sempadan tanah untuk halaman AWAM - dilukis di atas gambar atau video
// pada masa render, dari koordinat ternormal yang admin simpan.
//
// Kuncinya ialah `padanan`, yang mesti sepadan dengan cara media itu dimuatkan
// ke dalam bekasnya:
//   cover   -> gambar galeri (object-cover, dipangkas)  -> slice
//   contain -> embed YouTube (video di-letterbox dalam iframe) -> meet
// SVG mengulang pengiraan yang sama melalui preserveAspectRatio, jadi polygon
// dipangkas/di-letterbox betul-betul serentak dengan mediannya. Tanpa nisbah
// asal media kita tak boleh buat pengiraan itu, jadi kita jatuh balik kepada
// regangan penuh ("none") - betul selagi bekas dan media sama nisbah.

import type { Titik } from "@/lib/geran/polygon";

export default function PolygonOverlay({
  points,
  lebarMedia,
  tinggiMedia,
  padanan = "cover",
  label,
  className = "",
}: {
  points: Titik[];
  lebarMedia?: number | null;
  tinggiMedia?: number | null;
  padanan?: "cover" | "contain";
  label?: string | null;
  className?: string;
}) {
  if (!points || points.length < 3) return null;

  const adaNisbah = !!lebarMedia && !!tinggiMedia && lebarMedia > 0 && tinggiMedia > 0;
  const vbW = adaNisbah ? (lebarMedia as number) : 100;
  const vbH = adaNisbah ? (tinggiMedia as number) : 100;
  const nisbahAspek = adaNisbah ? (padanan === "cover" ? "xMidYMid slice" : "xMidYMid meet") : "none";

  const senarai = points.map(([x, y]) => `${(x * vbW).toFixed(2)},${(y * vbH).toFixed(2)}`).join(" ");
  const tengahX = (points.reduce((j, p) => j + p[0], 0) / points.length) * vbW;
  const tengahY = (points.reduce((j, p) => j + p[1], 0) / points.length) * vbH;
  const saizTeks = Math.max(10, vbH * 0.04);

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio={nisbahAspek}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <polygon
        points={senarai}
        fill="rgba(198, 138, 46, 0.18)"
        stroke="#F4C55C"
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.55))" }}
      />
      {label ? (
        <text
          x={tengahX}
          y={tengahY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={saizTeks}
          fontWeight={700}
          fill="#FFFFFF"
          stroke="rgba(0,0,0,0.65)"
          strokeWidth={saizTeks * 0.18}
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
