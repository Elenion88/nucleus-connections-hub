// 2D PCA-projected map of the whole Utah dataset.
// Highlights the focal entity and its top-K matches with a sequenced "match found" pulse.

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

interface Point { id: string; kind: 'talent' | 'startup'; label: string; sector: string; x: number; y: number }

const SECTOR_COLORS: Record<string, string> = {
  life_sciences: '#5a8c84',
  ai: '#7e5cad',
  defense: '#9c5a3c',
  cyber: '#3a6c93',
  energy: '#9c8b3c',
  advanced_manufacturing: '#c4794a',
  fintech: '#3c8b6e',
  software: '#5577aa',
  unknown: '#9aa0ad',
};

interface Props {
  focalId: string;          // the startup/talent we're examining
  highlightedIds: string[]; // its top-K matches (in order)
  height?: number;
}

export function LandscapeMap({ focalId, highlightedIds, height = 280 }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    api.landscape().then((r) => setPoints(r.points));
  }, []);

  // Sequenced reveal of the highlighted matches
  useEffect(() => {
    if (!points) return;
    setRevealedCount(0);
    let i = 0;
    const tick = () => {
      i++;
      setRevealedCount(i);
      if (i < highlightedIds.length) setTimeout(tick, 360);
    };
    const t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [points, highlightedIds.join(',')]);

  const focal = useMemo(() => points?.find((p) => p.id === focalId) ?? null, [points, focalId]);
  const W = 720, H = height, PAD = 30;

  if (!points) return <div className="card p-6 text-sm text-nucleus-subtle">Loading landscape…</div>;

  const project = (p: Point) => ({
    cx: PAD + ((p.x + 1) / 2) * (W - 2 * PAD),
    cy: PAD + ((1 - p.y) / 2) * (H - 2 * PAD),  // flip Y so up is +
  });

  const highlightSet = new Set(highlightedIds.slice(0, revealedCount));

  return (
    <div className="card overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block bg-white">
        {/* Lines from focal to each revealed match */}
        {focal && highlightedIds.slice(0, revealedCount).map((id, i) => {
          const m = points.find((p) => p.id === id);
          if (!m) return null;
          const a = project(focal);
          const b = project(m);
          return (
            <motion.line
              key={id}
              x1={a.cx} y1={a.cy}
              initial={{ x2: a.cx, y2: a.cy, opacity: 0 }}
              animate={{ x2: b.cx, y2: b.cy, opacity: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              stroke="#c4794a"
              strokeWidth={1.4}
              strokeDasharray="3 3"
            />
          );
        })}
        {/* All points */}
        {points.map((p) => {
          const { cx, cy } = project(p);
          const isFocal = p.id === focalId;
          const isHighlight = highlightSet.has(p.id);
          const isHovered = hoverId === p.id;
          const baseR = p.kind === 'startup' ? 6 : 4;
          const r = isFocal ? 9 : isHighlight ? 7 : baseR;
          const fill = isFocal
            ? '#0c1525'
            : isHighlight
              ? '#c4794a'
              : (SECTOR_COLORS[p.sector] ?? '#9aa0ad');
          const opacity = isFocal || isHighlight || isHovered ? 1 : 0.45;
          return (
            <g key={p.id}
               onMouseEnter={() => setHoverId(p.id)}
               onMouseLeave={() => setHoverId(null)}
               style={{ cursor: 'pointer' }}>
              {isHighlight && (
                <motion.circle
                  cx={cx} cy={cy}
                  initial={{ r: r, opacity: 0.7 }}
                  animate={{ r: r * 2.6, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
                  fill="#c4794a"
                />
              )}
              {p.kind === 'startup' ? (
                <rect
                  x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={1.5}
                  fill={fill}
                  opacity={opacity}
                  stroke={isFocal ? 'white' : 'rgba(255,255,255,.6)'}
                  strokeWidth={isFocal ? 2 : 1}
                />
              ) : (
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={fill}
                  opacity={opacity}
                  stroke={isFocal ? 'white' : 'rgba(255,255,255,.6)'}
                  strokeWidth={isFocal ? 2 : 1}
                />
              )}
              {(isFocal || isHovered || isHighlight) && (
                <text
                  x={cx} y={cy + r + 11}
                  textAnchor="middle"
                  fontSize={isFocal ? 11 : 10}
                  fontWeight={isFocal ? 700 : 500}
                  fill="#0c1525"
                  pointerEvents="none"
                >{p.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t hairline text-[11px] text-nucleus-subtle">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-nucleus-ink" /> This profile</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-nucleus-accent" /> Top matches</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-nucleus-accent2/70" /> Same sector</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Other</span>
        </div>
        <span className="hidden md:block">{points.length} profiles · 2D PCA of skills/needs embeddings</span>
      </div>
    </div>
  );
}
