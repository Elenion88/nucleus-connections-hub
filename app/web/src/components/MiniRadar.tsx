// Glanceable per-dimension radar for use inside match tiles. No labels, no
// axis text — just the polygon shape so the eye can pattern-match across
// candidates: "this one's a balanced pentagon · this one's lopsided on
// network · this one is missing skills."

interface Point { label: string; value: number }

export function MiniRadar({ data, size = 56, color = '#c4794a' }: { data: Point[]; size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const n = data.length;

  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const idealPolygon = data.map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const dataPath = data
    .map((d, i) => {
      const p = point(i, d.value);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: 'block' }} aria-hidden>
      {/* Ideal pentagon (background) */}
      <polygon points={idealPolygon} fill="rgba(90,140,132,0.06)" stroke="rgba(90,140,132,0.4)" strokeWidth={0.7} strokeDasharray="2 2" />
      {/* Data polygon */}
      <path d={dataPath} fill={color} fillOpacity={0.45} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const p = point(i, d.value);
        return <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={color} stroke="white" strokeWidth={0.7} />;
      })}
    </svg>
  );
}
