// Custom SVG radar — Recharts auto-domain doesn't behave well with our 0–100 scale, so we draw it ourselves.
// Optional `ideal` overlay renders a dashed sage-colored "perfect candidate" polygon behind the data,
// so the missing wedge between the two becomes visually obvious.

interface Point { label: string; value: number }

export function RadarFit({ data, size = 220, showIdeal = true }: { data: Point[]; size?: number; showIdeal?: boolean }) {
  const cx = size / 2;
  const cy = size / 2 + 6;             // shift down slightly so top label has room
  const r = size / 2 - 28;              // leave room for axis labels
  const n = data.length;

  // Polar to cartesian; angle starts at -90deg (top) and goes clockwise
  const point = (i: number, value: number) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle), angle };
  };
  const labelPoint = (i: number) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
    return { x: cx + (r + 16) * Math.cos(angle), y: cy + (r + 16) * Math.sin(angle), angle };
  };

  const rings = [25, 50, 75, 100];
  const dataPath = data
    .map((d, i) => {
      const p = point(i, d.value);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size + 12}`} width="100%" height={size + 12} style={{ display: 'block' }}>
      {/* Concentric rings */}
      {rings.map((pct, idx) => {
        const ringR = (pct / 100) * r;
        const points = data.map((_, i) => {
          const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
          return `${cx + ringR * Math.cos(angle)},${cy + ringR * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={pct}
            points={points}
            fill="none"
            stroke="#d6cdb9"
            strokeWidth={idx === rings.length - 1 ? 1 : 0.6}
            strokeDasharray={idx === rings.length - 1 ? '0' : '2 3'}
          />
        );
      })}
      {/* Spokes */}
      {data.map((_, i) => {
        const p = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e7e0d3" strokeWidth={0.8} />;
      })}
      {/* Ideal-candidate polygon (100 everywhere) — drawn first so data polygon sits on top */}
      {showIdeal && (() => {
        const idealPoints = data.map((_, i) => {
          const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            points={idealPoints}
            fill="#5a8c84"
            fillOpacity={0.06}
            stroke="#5a8c84"
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        );
      })()}
      {/* Data polygon */}
      <path d={dataPath} fill="#c4794a" fillOpacity={0.42} stroke="#c4794a" strokeWidth={2} strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const p = point(i, d.value);
        return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#c4794a" stroke="white" strokeWidth={1.2} />;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const lp = labelPoint(i);
        const isTop = Math.abs(lp.x - cx) < 4;
        const anchor = isTop ? 'middle' : lp.x > cx ? 'start' : 'end';
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y + 4}
            textAnchor={anchor}
            fontSize={11.5}
            fontWeight={600}
            fill="#0c1525"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
