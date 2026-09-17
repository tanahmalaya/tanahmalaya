type BarChartDatum = {
  label: string;
  value: number;
};

// Graph bar ringkas, tanpa dependency luar - satu siri data ikut masa
// (cth: pendaftaran ahli / merchandise terjual sebulan). Guna <title> SVG
// asli untuk tooltip hover (tak perlu JS client).
export default function BarChart({
  data,
  color = "#C68A2E",
  height = 180,
  formatValue = (v: number) => String(v),
}: {
  data: BarChartDatum[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;
  const gap = barWidth * 0.28;
  const plotHeight = height - 28; // ruang untuk label bawah

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label="Carta bar">
      <line x1={0} y1={plotHeight} x2={100} y2={plotHeight} stroke="#2A1D14" strokeOpacity={0.1} strokeWidth={0.5} />
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (plotHeight - 20);
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;
        const y = plotHeight - barHeight;
        return (
          <g key={d.label}>
            <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            <rect x={x} y={y} width={w} height={Math.max(barHeight, 1)} rx={1.2} fill={color} />
            {d.value > 0 && (
              <text
                x={x + w / 2}
                y={y - 2.5}
                textAnchor="middle"
                fontSize={4.2}
                fill="#2A1D14"
                fillOpacity={0.65}
                fontWeight={600}
              >
                {formatValue(d.value)}
              </text>
            )}
            <text
              x={x + w / 2}
              y={plotHeight + 8}
              textAnchor="middle"
              fontSize={4}
              fill="#2A1D14"
              fillOpacity={0.5}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
