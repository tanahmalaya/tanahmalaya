type Series = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

// Graph bar berkumpulan (2 siri) - untuk log masuk Ahli PLT vs Penjual
// GERAN ikut hari. Legend sentiasa dipaparkan sebab >= 2 siri (identiti tak
// bergantung warna sahaja - ada label terus & legend).
export default function GroupedBarChart({
  labels,
  series,
  height = 180,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupWidth = 100 / labels.length;
  const groupPad = groupWidth * 0.18;
  const innerWidth = groupWidth - groupPad * 2;
  const barGap = innerWidth * 0.08;
  const barWidth = (innerWidth - barGap * (series.length - 1)) / series.length;
  const plotHeight = height - 26;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-brand-dark/60">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Carta log masuk"
      >
        <line x1={0} y1={plotHeight} x2={100} y2={plotHeight} stroke="#2A1D14" strokeOpacity={0.1} strokeWidth={0.5} />
        {labels.map((label, gi) => {
          const groupX = gi * groupWidth + groupPad;
          return (
            <g key={label}>
              {series.map((s, si) => {
                const value = s.values[gi] ?? 0;
                const barHeight = (value / max) * (plotHeight - 14);
                const x = groupX + si * (barWidth + barGap);
                const y = plotHeight - barHeight;
                return (
                  <rect key={s.key} x={x} y={y} width={barWidth} height={Math.max(barHeight, value > 0 ? 1 : 0)} rx={0.8} fill={s.color}>
                    <title>{`${s.label} · ${label}: ${value}`}</title>
                  </rect>
                );
              })}
              <text x={groupX + innerWidth / 2} y={plotHeight + 8} textAnchor="middle" fontSize={3.6} fill="#2A1D14" fillOpacity={0.5}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
