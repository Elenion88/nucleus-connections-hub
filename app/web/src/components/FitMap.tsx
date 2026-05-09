// Semantic fit map. Replaces the abstract 2D-PCA "match landscape" with a
// scatter on axes a human can name: skills fit (X) vs sector fit (Y).
// Each candidate sits at (skills, sector) — both 0–100 from the matcher.
// Quadrants are labeled so a judge reads it in 2 seconds.
//
// Top-right     = Bullseye         · right skills + right sector
// Top-left      = Right sector     · domain knows you, skills don't yet
// Bottom-right  = Right skills     · skills check, but wrong domain
// Bottom-left   = Weak fit         · neither dimension overlaps yet

import { motion } from 'framer-motion';

export interface FitPoint {
  id: string;
  label: string;
  skills: number;     // 0..100
  sector: number;     // 0..100
  score: number;      // overall, used for sizing
  rank: number;
  highlight?: boolean;
}

interface Props {
  focalLabel: string;        // e.g. "Sarah Chen" — for the legend
  focalKind: 'talent' | 'startup';
  candidates: FitPoint[];    // top matches (already scored)
  height?: number;
  onPointClick?: (id: string) => void;
}

const W = 760, H = 360;
const PAD_L = 60;
const PAD_R = 28;
const PAD_T = 32;
const PAD_B = 50;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function FitMap({ focalLabel, focalKind, candidates, onPointClick }: Props) {
  const scaleX = (v: number) => PAD_L + (v / 100) * PLOT_W;
  const scaleY = (v: number) => PAD_T + ((100 - v) / 100) * PLOT_H;

  const midX = scaleX(50);
  const midY = scaleY(50);

  // Sort so highlighted points render on top (drawn last)
  const sorted = [...candidates].sort((a, b) => Number(!!a.highlight) - Number(!!b.highlight));

  return (
    <div className="rounded-xl2 border hairline bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" className="block">
        {/* Quadrant tints */}
        <rect x={midX} y={PAD_T}     width={PLOT_W / 2} height={PLOT_H / 2} fill="#5a8c84" fillOpacity={0.06} />
        <rect x={PAD_L} y={PAD_T}    width={PLOT_W / 2} height={PLOT_H / 2} fill="#9c8b3c" fillOpacity={0.04} />
        <rect x={midX} y={midY}      width={PLOT_W / 2} height={PLOT_H / 2} fill="#9c8b3c" fillOpacity={0.04} />
        <rect x={PAD_L} y={midY}     width={PLOT_W / 2} height={PLOT_H / 2} fill="#9aa0ad" fillOpacity={0.05} />

        {/* Quadrant labels */}
        <QuadLabel x={scaleX(75)} y={PAD_T + 18}            kicker="Top-right"    title="Bullseye"          color="#3a6c4f" />
        <QuadLabel x={scaleX(25)} y={PAD_T + 18}            kicker="Top-left"     title="Right sector · weak skills"  color="#7a6328" />
        <QuadLabel x={scaleX(75)} y={midY + 22}             kicker="Bottom-right" title="Right skills · weak sector"  color="#7a6328" />
        <QuadLabel x={scaleX(25)} y={midY + 22}             kicker="Bottom-left"  title="Weak fit"          color="#6e7280" />

        {/* Crosshairs */}
        <line x1={midX} y1={PAD_T} x2={midX} y2={PAD_T + PLOT_H} stroke="#cbcfd6" strokeWidth={1} strokeDasharray="3 4" />
        <line x1={PAD_L} y1={midY} x2={PAD_L + PLOT_W} y2={midY} stroke="#cbcfd6" strokeWidth={1} strokeDasharray="3 4" />

        {/* Axis frame */}
        <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="none" stroke="#cbcfd6" strokeWidth={1} />

        {/* Axis labels */}
        <text x={PAD_L + PLOT_W / 2} y={H - 14} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#0c1525">Skills fit →</text>
        <text x={20} y={PAD_T + PLOT_H / 2} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#0c1525" transform={`rotate(-90 20 ${PAD_T + PLOT_H / 2})`}>Sector fit →</text>

        {/* Tick labels */}
        <text x={PAD_L} y={H - 32} textAnchor="middle" fontSize={9} fill="#9aa0ad">0</text>
        <text x={midX} y={H - 32} textAnchor="middle" fontSize={9} fill="#9aa0ad">50</text>
        <text x={PAD_L + PLOT_W} y={H - 32} textAnchor="middle" fontSize={9} fill="#9aa0ad">100</text>
        <text x={PAD_L - 8} y={PAD_T + 4} textAnchor="end" fontSize={9} fill="#9aa0ad">100</text>
        <text x={PAD_L - 8} y={midY + 3} textAnchor="end" fontSize={9} fill="#9aa0ad">50</text>
        <text x={PAD_L - 8} y={PAD_T + PLOT_H + 3} textAnchor="end" fontSize={9} fill="#9aa0ad">0</text>

        {/* Points */}
        {sorted.map((p, i) => {
          const cx = scaleX(p.skills);
          const cy = scaleY(p.sector);
          const r = p.highlight ? 8 : 5.5;
          const fill = p.highlight ? '#c4794a' : '#9aa0ad';
          return (
            <g
              key={p.id}
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
              onClick={() => onPointClick?.(p.id)}
            >
              {p.highlight && (
                <motion.circle
                  cx={cx} cy={cy} r={r}
                  initial={{ r, opacity: 0.7 }}
                  animate={{ r: r * 2.2, opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                  fill={fill}
                />
              )}
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke="white" strokeWidth={p.highlight ? 2 : 1.2} opacity={p.highlight ? 1 : 0.55} />
              {p.highlight && (
                <text x={cx} y={cy + r + 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0c1525">
                  {p.rank ? `#${p.rank} ` : ''}{p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="border-t hairline px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px] text-nucleus-subtle">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Plotted relative to <span className="font-semibold text-nucleus-ink">{focalLabel}</span></span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nucleus-accent" /> Top matches</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 opacity-60" /> Other {focalKind === 'talent' ? 'startups' : 'operators'}</span>
        </div>
        <span>Two semantic axes · no PCA, no magic</span>
      </div>
    </div>
  );
}

function QuadLabel({ x, y, kicker, title, color }: { x: number; y: number; kicker: string; title: string; color: string }) {
  return (
    <g pointerEvents="none">
      <text x={x} y={y - 4} textAnchor="middle" fontSize={8} fill={color} opacity={0.7} style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{kicker}</text>
      <text x={x} y={y + 8} textAnchor="middle" fontSize={11} fontWeight={700} fill={color} opacity={0.85}>{title}</text>
    </g>
  );
}
