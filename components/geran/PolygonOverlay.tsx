// Overlay sempadan tanah untuk halaman AWAM - dilukis di atas gambar atau video
// pada masa render, dari koordinat ternormal yang admin simpan. Satu gambar
// boleh ada BANYAK lot (cth. tanah dipecah jual Lot 1, Lot 2, ...), jadi
// komponen ni terima senarai lot dan lukis setiap satu sebagai polygon +
// label berasingan dalam SVG yang sama.
//
// Kuncinya ialah `padanan`, yang mesti sepadan dengan cara media itu dimuatkan
// ke dalam bekasnya:
//   cover   -> gambar galeri (object-cover, dipangkas)  -> slice
//   contain -> embed YouTube (video di-letterbox dalam iframe) -> meet
// SVG mengulang pengiraan yang sama melalui preserveAspectRatio, jadi polygon
// dipangkas/di-letterbox betul-betul serentak dengan mediannya. Tanpa nisbah
// asal media kita tak boleh buat pengiraan itu, jadi kita jatuh balik kepada
// regangan penuh ("none") - betul selagi bekas dan media sama nisbah.

import type { LotPolygon } from "@/lib/geran/polygon";
import { formatRM } from "@/lib/geran";

function labelLot(lot: LotPolygon): string | null {
  const bahagian = [lot.label?.trim() || null, lot.hargaSen ? formatRM(lot.hargaSen) : null].filter(
    Boolean
  );
  return bahagian.length > 0 ? bahagian.join(" — ") : null;
}

export default function PolygonOverlay({
  lots,
  lebarMedia,
  tinggiMedia,
  padanan = "cover",
  className = "",
}: {
  lots: LotPolygon[];
  lebarMedia?: number | null;
  tinggiMedia?: number | null;
  padanan?: "cover" | "contain";
  className?: string;
}) {
  const sah = lots.filter((l) => l.points.length >= 3);
  if (sah.length === 0) return null;

  const adaNisbah = !!lebarMedia && !!tinggiMedia && lebarMedia > 0 && tinggiMedia > 0;
  const vbW = adaNisbah ? (lebarMedia as number) : 100;
  const vbH = adaNisbah ? (tinggiMedia as number) : 100;
  const nisbahAspek = adaNisbah ? (padanan === "cover" ? "xMidYMid slice" : "xMidYMid meet") : "none";
  const saizTeks = Math.max(10, vbH * 0.04);

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio={nisbahAspek}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      {sah.map((lot) => {
        const senarai = lot.points.map(([x, y]) => `${(x * vbW).toFixed(2)},${(y * vbH).toFixed(2)}`).join(" ");
        const tengahX = (lot.points.reduce((j, p) => j + p[0], 0) / lot.points.length) * vbW;
        const tengahY = (lot.points.reduce((j, p) => j + p[1], 0) / lot.points.length) * vbH;
        const teks = labelLot(lot);

        return (
          <g key={lot.id}>
            <polygon
              points={senarai}
              fill="rgba(198, 138, 46, 0.18)"
              stroke="#F4C55C"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.55))" }}
            />
            {teks ? (
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
                {teks}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
