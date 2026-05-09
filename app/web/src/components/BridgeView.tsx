// Personal Network Bridge — replaces the abstract fit-map hero with a graph
// slice that shows WHY each top match connects to the focal: shared
// institutions (Recursion, U of U, etc.), shared sectors, shared mission
// tags, and any direct edges from the connection table.
//
// Reads as: focal (left) → bridge nodes (middle) → matches (right). Curve
// thickness scales with how many candidates share that bridge. The "moat"
// of this product — utah-specific network reasoning — finally lives where
// a judge can see it.

import { useMemo, useState } from 'react';
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

const W = 960;
const H = 480;
const PAD_T = 40;
const PAD_B = 30;
const FOCAL_X = 80;
const BRIDGE_X = 400;
const MATCH_X = 720;

export function BridgeView({
  focal, matches, edges = [], onSelectBridge,
}: {
  focal: BridgeFocal;
  matches: BridgeMatch[];
  edges?: BridgeEdge[];
  onSelectBridge?: (bridge: { id: string; label: string; matchIds: string[] } | null) => void;
}) {

  const bridges = useMemo(() => buildBridges(focal, matches, edges), [focal, matches, edges]);
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  function selectBridge(id: string | null) {
    const next = id === selectedBridgeId ? null : id;
    setSelectedBridgeId(next);
    setSelectedMatchId(null);
    if (!onSelectBridge) return;
    if (next === null) {
      onSelectBridge(null);
    } else {
      const b = bridges.find((x) => x.id === next);
      if (b) onSelectBridge({ id: b.id, label: b.label, matchIds: b.matches });
    }
  }
  function selectMatch(id: string | null) {
    const next = id === selectedMatchId ? null : id;
    setSelectedMatchId(next);
    setSelectedBridgeId(null);
    if (!onSelectBridge) return;
    if (next === null) {
      onSelectBridge(null);
    } else {
      const m = matches.find((x) => x.id === next);
      if (m) onSelectBridge({ id: `match:${m.id}`, label: m.name, matchIds: [m.id] });
    }
  }
  function clearAll() {
    setSelectedBridgeId(null);
    setSelectedMatchId(null);
    onSelectBridge?.(null);
  }

  const selectedBridge = bridges.find((b) => b.id === selectedBridgeId);
  const dimMode = selectedBridge != null || selectedMatchId != null;
  const matchIsActive = (mid: string) => {
    if (!dimMode) return true;
    if (selectedBridge) return selectedBridge.matches.includes(mid);
    return mid === selectedMatchId;
  };
  const bridgeIsActive = (b: Bridge) => {
    if (!dimMode) return true;
    if (selectedBridgeId) return b.id === selectedBridgeId;
    if (selectedMatchId) return b.matches.includes(selectedMatchId);
    return true;
  };

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
        {focalToBridge.map(({ b, y }, i) => {
          const active = bridgeIsActive(b);
          return (
            <BridgeCurve
              key={`fb-${b.id}`}
              x1={FOCAL_X + 30} y1={focalY}
              x2={BRIDGE_X - 90} y2={y}
              color={bridgeColor(b.kind)}
              weight={(1 + b.matches.length * 0.4) * (active ? 1 : 0.6)}
              opacity={active ? 0.9 : 0.08}
              delay={i * 0.05}
            />
          );
        })}

        {/* Curves: bridge → each connected match */}
        {bridges.map((b) => b.matches.map((mid, j) => {
          const matchInfo = matchById.get(mid);
          const bridgeInfo = bridgeById.get(b.id);
          if (!matchInfo || !bridgeInfo) return null;
          // Curve is active iff its bridge AND its match are both active.
          const active = bridgeIsActive(b) && matchIsActive(mid);
          return (
            <BridgeCurve
              key={`bm-${b.id}-${mid}`}
              x1={BRIDGE_X + 90} y1={bridgeInfo.y}
              x2={MATCH_X - 24} y2={matchInfo.y}
              color={bridgeColor(b.kind)}
              weight={1.4}
              opacity={active ? 0.65 : 0.05}
              delay={0.15 + j * 0.04}
            />
          );
        }))}

        {/* Focal node — clicking clears any active selection */}
        <FocalNode x={FOCAL_X} y={focalY} label={focal.name} kind={focal.kind} onClick={clearAll} />

        {/* Bridge nodes */}
        {bridges.map((b, i) => (
          <BridgeNode
            key={b.id}
            x={BRIDGE_X} y={bridgeYs[i]}
            label={b.label}
            kind={b.kind}
            count={b.matches.length}
            selected={b.id === selectedBridgeId}
            dimmed={!bridgeIsActive(b)}
            onClick={() => selectBridge(b.id)}
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
            active={matchIsActive(m.id)}
            selected={m.id === selectedMatchId}
            onClick={() => selectMatch(m.id)}
            delay={0.15 + i * 0.05}
          />
        ))}
      </svg>

      <div className="border-t hairline px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-xs text-nucleus-subtle">
        <div className="flex items-center gap-3 flex-wrap">
          {selectedBridge ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-nucleus-ink font-semibold">
                <span className="w-2 h-2 rounded-full" style={{ background: bridgeColor(selectedBridge.kind) }} />
                Filtering by {selectedBridge.label}
              </span>
              <span className="text-nucleus-subtle">{selectedBridge.matches.length} of {matches.length} matches share this bridge.</span>
              <button onClick={clearAll} className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-nucleus-cream hover:bg-nucleus-line transition-colors">Clear</button>
            </>
          ) : selectedMatchId ? (() => {
            const m = matches.find((x) => x.id === selectedMatchId);
            const matchedBridges = bridges.filter((b) => b.matches.includes(selectedMatchId)).map((b) => b.label);
            return (
              <>
                <span className="inline-flex items-center gap-1.5 text-nucleus-ink font-semibold">
                  <span className="w-2 h-2 rounded-full bg-nucleus-accent" />
                  Showing bridges to {m?.name ?? 'selected match'}
                </span>
                <span className="text-nucleus-subtle">{matchedBridges.length} of {bridges.length} bridges connect.</span>
                <button onClick={clearAll} className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-nucleus-cream hover:bg-nucleus-line transition-colors">Clear</button>
              </>
            );
          })() : (
            <>
              <span className="font-semibold text-nucleus-ink">Tap a bridge or match to filter:</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('institution') }} /> Institution</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('sector') }} /> Sector</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('mission') }} /> Mission</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: bridgeColor('direct') }} /> Direct edge</span>
            </>
          )}
        </div>
        <span className="hidden md:inline">Curve weight = # of matches sharing the bridge</span>
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

function FocalNode({ x, y, label, kind, onClick }: { x: number; y: number; label: string; kind: 'talent' | 'startup'; onClick?: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <motion.circle
        cx={x} cy={y} r={32}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'backOut' }}
        fill={kind === 'startup' ? '#c4794a' : '#0c1525'}
        stroke="white" strokeWidth={3}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="white" pointerEvents="none">
        {initials(label)}
      </text>
      <text x={x} y={y + 56} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0c1525">{label}</text>
      <text x={x} y={y + 72} textAnchor="middle" fontSize={10} fontWeight={600} fill="#9aa0ad" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>You · click to clear</text>
    </g>
  );
}

function BridgeNode({ x, y, label, kind, count, selected, dimmed, onClick, delay }: {
  x: number; y: number; label: string; kind: Bridge['kind']; count: number;
  selected: boolean; dimmed: boolean; onClick: () => void; delay: number;
}) {
  const color = bridgeColor(kind);
  // Two-line layout: label on top, count chip on bottom — keeps everything inside the pill
  const w = Math.min(210, Math.max(130, label.length * 9 + 36));
  const h = 56;
  const fillBg = selected ? color : 'white';
  const labelColor = selected ? 'white' : '#0c1525';
  const opacity = dimmed ? 0.25 : 1;
  const countLabel = selected ? `selected · ${count}` : `${count} match${count === 1 ? '' : 'es'}`;
  return (
    <motion.g
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'backOut' }}
      style={{ cursor: 'pointer' }}
    >
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2}
            fill={fillBg} stroke={color} strokeWidth={selected ? 2.5 : 1.8} />
      <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle"
            fontSize={13.5} fontWeight={700} fill={labelColor}>
        {label}
      </text>
      <text x={x} y={y + 14} textAnchor="middle" dominantBaseline="middle"
            fontSize={9.5} fontWeight={600}
            fill={selected ? 'rgba(255,255,255,0.9)' : color}
            style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {countLabel}
      </text>
    </motion.g>
  );
}

function MatchNode({ x, y, label, score, rank, kind, connected, active, selected, onClick, delay }: {
  x: number; y: number; label: string; score: number; rank: number;
  kind: 'talent' | 'startup'; connected: boolean; active: boolean; selected: boolean;
  onClick: () => void; delay: number;
}) {
  const baseOp = connected ? 1 : 0.5;
  const opacity = active ? baseOp : 0.18;
  const chipFill = selected ? '#c4794a' : (connected ? '#0c1525' : '#9aa0ad');
  return (
    <motion.g
      onClick={onClick}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity, x: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ cursor: 'pointer' }}
    >
      {/* selected ring */}
      {selected && (
        <circle cx={x} cy={y} r={28} fill="none" stroke="#c4794a" strokeWidth={1.5} strokeDasharray="3 3" />
      )}
      {/* Score chip */}
      <circle cx={x} cy={y} r={22}
              fill={chipFill}
              stroke="white" strokeWidth={2.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="white" pointerEvents="none">{score}</text>

      {/* Label to right (clickable) */}
      <text x={x + 34} y={y - 2} fontSize={13} fontWeight={selected ? 800 : 700} fill={selected ? '#c4794a' : '#0c1525'}>
        #{rank} {truncate(label, 24)}
      </text>
      <text x={x + 34} y={y + 14} fontSize={10} fontWeight={600} fill="#9aa0ad"
            style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {kind === 'startup' ? 'Startup' : 'Operator'}{connected ? '' : ' · skills only'}{selected ? ' · selected' : ''}
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
