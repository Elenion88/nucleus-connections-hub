// Auto-cycling landscape view for the landing hero. Rotates through three flagship startups,
// pulling their top-5 matches and animating lines + pulses as the focal changes.
// Built for the "judges see live matching in 2 seconds" goal.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Sparkles } from 'lucide-react';

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

const FLAGSHIPS = [
  { id: 'st_neurotouch', label: 'NeuroTouch Bio',    blurb: 'Implantable neural interface that lets prosthetics feel touch.' },
  { id: 'st_silicell',   label: 'SiliCell Compute',  blurb: 'Silicon scaffolds populated with cultured neuronal tissue.' },
  { id: 'st_aerolith',   label: 'Aerolith Defense',  blurb: 'Autonomous swarm logistics for contested-environment resupply.' },
];

const CYCLE_MS = 7000;

export function HeroLandscape() {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [topNames, setTopNames] = useState<string[]>([]);

  // Load the projection once
  useEffect(() => { api.landscape().then((r) => setPoints(r.points)); }, []);

  // Cycle the focal startup
  useEffect(() => {
    const t = setInterval(() => setCycleIdx((i) => (i + 1) % FLAGSHIPS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  // Whenever cycleIdx changes, fetch top matches for the new focal
  useEffect(() => {
    const focalId = FLAGSHIPS[cycleIdx].id;
    api.matchesForStartup(focalId, 5)
      .then((r) => {
        setHighlightedIds(r.matches.map((m) => m.talent.id));
        setTopNames(r.matches.slice(0, 3).map((m) => m.talent.name));
        setRevealedCount(0);
      })
      .catch(() => { /* silent */ });
  }, [cycleIdx]);

  // Sequenced reveal of the highlights
  useEffect(() => {
    if (highlightedIds.length === 0) return;
    setRevealedCount(0);
    let i = 0;
    const tick = () => {
      i++;
      setRevealedCount(i);
      if (i < highlightedIds.length) setTimeout(tick, 280);
    };
    const start = setTimeout(tick, 350);
    return () => clearTimeout(start);
  }, [highlightedIds]);

  const focal = useMemo(
    () => points?.find((p) => p.id === FLAGSHIPS[cycleIdx].id) ?? null,
    [points, cycleIdx]
  );

  const W = 760, H = 460, PAD = 36;
  const project = (p: { x: number; y: number }) => ({
    cx: PAD + ((p.x + 1) / 2) * (W - 2 * PAD),
    cy: PAD + ((1 - p.y) / 2) * (H - 2 * PAD),
  });

  const highlightSet = new Set(highlightedIds.slice(0, revealedCount));

  return (
    <div className="relative">
      {/* Caption strip above the map */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nucleus-accent/10 text-nucleus-accent border border-nucleus-accent/20">
          <span className="w-1.5 h-1.5 rounded-full bg-nucleus-accent animate-pulse" />
          Live · matching now
        </span>
        <motion.span
          key={cycleIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-nucleus-subtle truncate"
        >
          <span className="font-semibold text-nucleus-ink">{FLAGSHIPS[cycleIdx].label}</span> ·{' '}
          <span className="hidden sm:inline">{FLAGSHIPS[cycleIdx].blurb}</span>
        </motion.span>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-soft border border-nucleus-line/60 bg-gradient-to-br from-white to-nucleus-cream">
        {!points && (
          <div className="aspect-[760/460] flex items-center justify-center text-nucleus-subtle text-sm">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Loading the Utah landscape…
          </div>
        )}
        {points && (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
            {/* subtle dot-grid */}
            <defs>
              <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1.2" cy="1.2" r="0.9" fill="rgba(12,21,37,.07)" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#dotgrid)" />

            {/* Lines focal -> revealed matches */}
            {focal && highlightedIds.slice(0, revealedCount).map((id, i) => {
              const m = points.find((p) => p.id === id);
              if (!m) return null;
              const a = project(focal);
              const b = project(m);
              return (
                <motion.line
                  key={`${cycleIdx}-${id}`}
                  x1={a.cx} y1={a.cy}
                  initial={{ x2: a.cx, y2: a.cy, opacity: 0 }}
                  animate={{ x2: b.cx, y2: b.cy, opacity: 0.7 }}
                  transition={{ duration: 0.55, delay: i * 0.05 }}
                  stroke="#c4794a"
                  strokeWidth={1.4}
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* All points */}
            {points.map((p) => {
              const { cx, cy } = project(p);
              const isFocal = p.id === FLAGSHIPS[cycleIdx].id;
              const isHighlight = highlightSet.has(p.id);
              const baseR = p.kind === 'startup' ? 6.5 : 4.5;
              const r = isFocal ? 10 : isHighlight ? 7.5 : baseR;
              const fill = isFocal
                ? '#0c1525'
                : isHighlight
                  ? '#c4794a'
                  : (SECTOR_COLORS[p.sector] ?? '#9aa0ad');
              const opacity = isFocal || isHighlight ? 1 : 0.45;
              return (
                <g key={p.id}>
                  {isHighlight && (
                    <motion.circle
                      cx={cx} cy={cy}
                      initial={{ r: r, opacity: 0.7 }}
                      animate={{ r: r * 2.6, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
                      fill="#c4794a"
                    />
                  )}
                  {isFocal && (
                    <motion.circle
                      cx={cx} cy={cy}
                      initial={{ r: r, opacity: 0.4 }}
                      animate={{ r: r * 3, opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      fill="#0c1525"
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
                  {(isFocal || isHighlight) && (
                    <text
                      x={cx} y={cy + r + 12}
                      textAnchor="middle"
                      fontSize={isFocal ? 12 : 10.5}
                      fontWeight={isFocal ? 700 : 500}
                      fill="#0c1525"
                      pointerEvents="none"
                    >{p.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {/* Bottom legend strip */}
        <div className="absolute left-0 right-0 bottom-0 px-4 py-2 flex items-center justify-between text-[10px] text-nucleus-subtle bg-gradient-to-t from-white/95 via-white/80 to-transparent">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nucleus-ink" /> Focal</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nucleus-accent" /> Top matches</span>
            <span className="hidden sm:inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Other Utah profiles</span>
          </div>
          <span className="hidden md:inline">2D PCA · 53 profiles · cycling every {CYCLE_MS / 1000}s</span>
        </div>
      </div>

      {/* Top match preview chips beneath the map */}
      <div className="mt-3 min-h-[28px]">
        <motion.div
          key={cycleIdx + '-top'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex items-center gap-2 flex-wrap text-xs text-nucleus-subtle"
        >
          <span className="text-[10px] uppercase tracking-widest">top operators surfaced</span>
          {topNames.map((n) => (
            <span key={n} className="pill-soft">{n}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
