// Personal Network Bridge — replaces the abstract fit-map hero with a graph
// slice that shows WHY each top match connects to the focal: shared
// institutions (Recursion, U of U, etc.), shared sectors, shared mission
// tags, and any direct edges from the connection table.
//
// Reads as: focal (left) → bridge nodes (middle) → matches (right). Curve
// thickness scales with how many candidates share that bridge. The "moat"
// of this product — utah-specific network reasoning — finally lives where
// a judge can see it.

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export interface BridgeFocal {
  id: string;
  name: string;
  kind: 'talent' | 'startup';
  affiliations: string[];   // institutions: u_of_u, byu, usu, recursion, sarcos…
  sectors: string[];
  mission: string[];
}

export interface BridgeMatch {
  id: string;
  name: string;
  kind: 'talent' | 'startup';
  rank: number;
  score: number;
  affiliations: string[];
  sectors: string[];
  mission: string[];
}

export interface BridgeEdge {
  from: string;
  to: string;
  kind: string;
  evidence?: string;
}

interface Bridge {
  id: string;
  label: string;
  kind: 'institution' | 'sector' | 'mission' | 'direct';
  matches: string[];   // ids of matches that connect through this bridge
}

const INST_LABELS: Record<string, string> = {
  u_of_u: 'University of Utah',
  byu: 'BYU',
  usu: 'Utah State',
  silicon_slopes: 'Silicon Slopes',
  recursion: 'Recursion',
  sarcos: 'Sarcos',
  domo: 'Domo',
  pluralsight: 'Pluralsight',
  qualtrics: 'Qualtrics',
  intermountain: 'Intermountain',
  huntsman: 'Huntsman Cancer Institute',
  afwerx: 'AFWERX',
};

const SECTOR_LABELS: Record<string, string> = {
  life_sciences: 'Life Sciences',
  ai: 'AI',
  defense: 'Defense',
  cyber: 'Cyber',
  energy: 'Energy',
  advanced_manufacturing: 'Adv. Manufacturing',
  fintech: 'Fintech',
  software: 'Software',
};

const MISSION_LABELS: Record<string, string> = {
  patient_outcomes: 'Patient outcomes',
  deep_science: 'Deep science',
  hard_tech: 'Hard tech',
  defense: 'Defense mission',
  climate: 'Climate',
  community: 'Community',
};

const W = 880;
const H = 460;
const PAD_T = 32;
const PAD_B = 22;
const FOCAL_X = 80;
const BRIDGE_X = 380;
const MATCH_X = 720;

export function BridgeView({
  focal, matches, edges = [],
}: { focal: BridgeFocal; matches: BridgeMatch[]; edges?: BridgeEdge[] }) {

  const bridges = useMemo(() => buildBridges(focal, matches, edges), [focal, matches, edges]);

  // Layout: vertically distribute bridges and matches
  const bridgeYs = layoutColumn(bridges.length, PAD_T, H - PAD_B);
  const matchYs = layoutColumn(matches.length, PAD_T, H - PAD_B);
  const focalY = H / 2;

  const matchById = new Map(matches.map((m, i) => [m.id, { match: m, y: matchYs[i] }]));
  const bridgeById = new Map(bridges.map((b, i) => [b.id, { bridge: b, y: bridgeYs[i] }]));

  // Build curves: focal→bridge and bridge→match
  // Curve width scales with # of matches that share the bridge.
  const focalToBridge = bridges.map((b, i) => ({ b, y: bridgeYs[i] }));

  return (
    <div className="rounded-xl2 border hairline bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" className="block">
        {/* dot grid */}
        <defs>
          <pattern id="bvgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(12,21,37,.05)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#bvgrid)" />

        {/* Curves: focal → bridge (one per bridge) */}
        {focalToBridge.map(({ b, y }, i) => (
          <BridgeCurve
            key={`fb-${b.id}`}
            x1={FOCAL_X + 30} y1={focalY}
            x2={BRIDGE_X - 80} y2={y}
            color={bridgeColor(b.kind)}
            weight={1 + b.matches.length * 0.4}
            delay={i * 0.05}
          />
        ))}

        {/* Curves: bridge → each connected match */}
        {bridges.map((b) => b.matches.map((mid, j) => {
          const matchInfo = matchById.get(mid);
          const bridgeInfo = bridgeById.get(b.id);
          if (!matchInfo || !bridgeInfo) return null;
          return (
            <BridgeCurve
              key={`bm-${b.id}-${mid}`}
              x1={BRIDGE_X + 80} y1={bridgeInfo.y}
              x2={MATCH_X - 24} y2={matchInfo.y}
              color={bridgeColor(b.kind)}
              weight={1.2}
              opacity={0.6}
              delay={0.15 + j * 0.04}
            />
          );
        }))}

        {/* Focal node */}
        <FocalNode x={FOCAL_X} y={focalY} label={focal.name} kind={focal.kind} />

        {/* Bridge nodes */}
        {bridges.map((b, i) => (
          <BridgeNode
            key={b.id}
            x={BRIDGE_X} y={bridgeYs[i]}
            label={b.label}
            kind={b.kind}
            count={b.matches.length}
            delay={i * 0.05}
          />
        ))}

        {/* Match nodes */}
        {matches.map((m, i) => (
          <MatchNode
            key={m.id}
            x={MATCH_X} y={matchYs[i]}
            label={m.name}
            score={m.score}
            rank={m.rank}
            kind={m.kind}
            connected={isConnected(m.id, bridges)}
            delay={0.15 + i * 0.05}
          />
        ))}
      </svg>

      <div className="border-t hairline px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px] text-nucleus-subtle">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Bridges: </span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('institution') }} /> Institution</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('sector') }} /> Sector</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('mission') }} /> Mission</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('direct') }} /> Direct edge</span>
        </div>
        <span>Curve weight = # of matches sharing the bridge</span>
      </div>
    </div>
  );
}

function isConnected(matchId: string, bridges: Bridge[]): boolean {
  return bridges.some((b) => b.matches.includes(matchId));
}

function bridgeColor(kind: Bridge['kind']): string {
  return kind === 'institution' ? '#5a8c84'
    : kind === 'sector'         ? '#c4794a'
    : kind === 'mission'        ? '#7e5cad'
    :                             '#0c1525';
}

function BridgeCurve({ x1, y1, x2, y2, color, weight, opacity = 0.85, delay = 0 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; weight: number; opacity?: number; delay?: number;
}) {
  const cx = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    />
  );
}

function FocalNode({ x, y, label, kind }: { x: number; y: number; label: string; kind: 'talent' | 'startup' }) {
  return (
    <g>
      <motion.circle
        cx={x} cy={y} r={26}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'backOut' }}
        fill={kind === 'startup' ? '#c4794a' : '#0c1525'}
        stroke="white" strokeWidth={3}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="white" pointerEvents="none">
        {initials(label)}
      </text>
      <text x={x} y={y + 50} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0c1525">{label}</text>
      <text x={x} y={y + 64} textAnchor="middle" fontSize={9} fill="#9aa0ad" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>You</text>
    </g>
  );
}

function BridgeNode({ x, y, label, kind, count, delay }: {
  x: number; y: number; label: string; kind: Bridge['kind']; count: number; delay: number;
}) {
  const color = bridgeColor(kind);
  // Approximate width based on label length
  const w = Math.min(160, Math.max(96, label.length * 7 + 28));
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'backOut' }}
    >
      <rect x={x - w / 2} y={y - 16} width={w} height={32} rx={16}
            fill="white" stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#0c1525">
        {label}
      </text>
      <text x={x} y={y + 30} textAnchor="middle" fontSize={9} fill={color}
            style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {count} match{count === 1 ? '' : 'es'}
      </text>
    </motion.g>
  );
}

function MatchNode({ x, y, label, score, rank, kind, connected, delay }: {
  x: number; y: number; label: string; score: number; rank: number; kind: 'talent' | 'startup'; connected: boolean; delay: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: connected ? 1 : 0.45, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* Score chip */}
      <circle cx={x} cy={y} r={20}
              fill={connected ? '#0c1525' : '#9aa0ad'}
              stroke="white" strokeWidth={2.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="white">{score}</text>

      {/* Label to right */}
      <text x={x + 32} y={y - 2} fontSize={11.5} fontWeight={700} fill="#0c1525">
        #{rank} {truncate(label, 22)}
      </text>
      <text x={x + 32} y={y + 12} fontSize={9} fill="#9aa0ad"
            style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {kind === 'startup' ? 'Startup' : 'Operator'}{connected ? '' : ' · skills only'}
      </text>
    </motion.g>
  );
}

// ----------------- Bridge construction -----------------

function buildBridges(focal: BridgeFocal, matches: BridgeMatch[], edges: BridgeEdge[]): Bridge[] {
  const out: Bridge[] = [];

  // 1. Direct edges (advisor_to, past_coworker, lab_collaborator, mentor_of, etc.)
  for (const e of edges) {
    const otherKind = e.from === focal.id ? 'to' : 'from';
    const otherId = e.from === focal.id ? e.to : e.from;
    if (matches.some((m) => m.id === otherId)) {
      out.push({
        id: `direct:${e.from}-${e.to}`,
        label: prettyEdgeKind(e.kind),
        kind: 'direct',
        matches: [otherId],
      });
    }
  }

  // 2. Institutions Sarah has → matches that share at least one
  for (const inst of focal.affiliations) {
    const sharedWith = matches.filter((m) => m.affiliations.includes(inst)).map((m) => m.id);
    if (sharedWith.length === 0) continue;
    out.push({
      id: `inst:${inst}`,
      label: INST_LABELS[inst] ?? humanize(inst),
      kind: 'institution',
      matches: sharedWith,
    });
  }

  // 3. Sectors shared
  for (const sec of focal.sectors) {
    const sharedWith = matches.filter((m) => m.sectors.includes(sec)).map((m) => m.id);
    if (sharedWith.length === 0) continue;
    out.push({
      id: `sec:${sec}`,
      label: SECTOR_LABELS[sec] ?? humanize(sec),
      kind: 'sector',
      matches: sharedWith,
    });
  }

  // 4. Mission tags shared
  for (const m of focal.mission) {
    const sharedWith = matches.filter((mm) => mm.mission.includes(m)).map((mm) => mm.id);
    if (sharedWith.length === 0) continue;
    out.push({
      id: `mis:${m}`,
      label: MISSION_LABELS[m] ?? humanize(m),
      kind: 'mission',
      matches: sharedWith,
    });
  }

  // Sort: most matches first, with a kind-priority tiebreak
  const kindOrder: Record<Bridge['kind'], number> = { direct: 0, institution: 1, sector: 2, mission: 3 };
  out.sort((a, b) => b.matches.length - a.matches.length || kindOrder[a.kind] - kindOrder[b.kind]);

  // Cap to 6 bridges so the chart breathes
  return out.slice(0, 6);
}

function layoutColumn(n: number, top: number, bottom: number): number[] {
  if (n === 0) return [];
  if (n === 1) return [(top + bottom) / 2];
  const step = (bottom - top) / (n - 1);
  return Array.from({ length: n }, (_, i) => top + i * step);
}

function prettyEdgeKind(kind: string): string {
  const map: Record<string, string> = {
    advisor_to: 'Advisor',
    past_coworker: 'Past coworker',
    lab_collaborator: 'Lab collaborator',
    mentor_of: 'Mentor',
    cofounded_with: 'Cofounded with',
    investor_in: 'Investor in',
    colleague: 'Colleague',
  };
  return map[kind] ?? humanize(kind);
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
