// Overlay all top-N candidates on a single radar chart, each in a different
// translucent color. Reads as: "where do all our top matches agree, and where
// do they differ?" Skills + Sector usually saturate near the same value;
// Network is where shapes diverge most.

import { motion } from 'framer-motion';

interface Series {
  id: string;
  label: string;
  rank: number;
  values: number[];   // same length as axes, 0–100
}

interface Props {
  axes: string[];                      // ['Skills', 'Sector', 'Stage', 'Mission', 'Network']
  series: Series[];
  size?: number;
}

const PALETTE = ['#c4794a', '#5a8c84', '#7e5cad', '#3a6c93', '#9c8b3c', '#9c5a3c'];

export function MultiRadar({ axes, series, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = size / 2 - 38;
  const n = axes.length;

  const point = (i: number, value: number) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };
  const labelPoint = (i: number) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
    return { x: cx + (r + 18) * Math.cos(angle), y: cy + (r + 18) * Math.sin(angle) };
  };

  const polygonPath = (vals: number[]) =>
    vals.map((v, i) => {
      const p = point(i, v);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ') + ' Z';

  return (
    <div className="grid sm:grid-cols-[1fr_220px] gap-5 items-center">
      <svg viewBox={`0 0 ${size} ${size + 16}`} width="100%" style={{ display: 'block' }}>
        {/* Concentric rings */}
        {[25, 50, 75, 100].map((pct, idx) => {
          const ringR = (pct / 100) * r;
          const points = axes.map((_, i) => {
            const a = (-Math.PI / 2) + (2 * Math.PI * i) / n;
            return `${cx + ringR * Math.cos(a)},${cy + ringR * Math.sin(a)}`;
          }).join(' ');
          return (
            <polygon
              key={pct}
              points={points}
              fill="none"
              stroke="#d6cdb9"
              strokeWidth={idx === 3 ? 1 : 0.6}
              strokeDasharray={idx === 3 ? '0' : '2 3'}
            />
          );
        })}
        {/* Spokes */}
        {axes.map((_, i) => {
          const p = point(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e7e0d3" strokeWidth={0.8} />;
        })}
        {/* Series polygons (overlay) */}
        {series.map((s, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return (
            <motion.path
              key={s.id}
              d={polygonPath(s.values)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeWidth={1.6}
              strokeLinejoin="round"
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
        {/* Series points (small) */}
        {series.map((s, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return (
            <g key={`pts-${s.id}`}>
              {s.values.map((v, i) => {
                const p = point(i, v);
                return <circle key={i} cx={p.x} cy={p.y} r={2.2} fill={color} stroke="white" strokeWidth={0.8} />;
              })}
            </g>
          );
        })}
        {/* Axis labels */}
        {axes.map((label, i) => {
          const p = labelPoint(i);
          const isLeft = p.x < cx - 5;
          const isRight = p.x > cx + 5;
          const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
          return (
            <text key={label} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
                  fontSize={11} fontWeight={600} fill="#0c1525">
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend with per-series scores */}
      <div className="space-y-2 text-sm">
        <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold mb-1">Top {series.length} candidates</div>
        {series.map((s, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const avg = Math.round(s.values.reduce((a, b) => a + b, 0) / s.values.length);
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color, opacity: 0.7 }} />
              <span className="text-xs font-medium text-nucleus-ink truncate flex-1">#{s.rank} {s.label}</span>
              <span className="text-xs tabular-nums text-nucleus-subtle">avg {avg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
