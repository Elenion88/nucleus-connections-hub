// Storytelling-mode Network page. Lead with curated stories about *what the matcher
// caught in the data*; let the user click through filters and stories rather than
// staring at an abstract force-directed wall of nodes.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Filter, ArrowRight, Network as NetworkIcon, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, pretty } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Node {
  id: string; kind: string; label: string; sublabel?: string;
  sector?: string; sectors?: string[];
  x?: number; y?: number; vx?: number; vy?: number;
}
interface Edge { from: string; to: string; kind: string; evidence?: string }

const W = 880, H = 560;

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

const EDGE_STYLE: Record<string, { color: string; dash?: string; weight: number }> = {
  alumnus_of:       { color: '#cbb89a', dash: '2 4', weight: 0.9 },
  origin:           { color: '#cbb89a', dash: '2 4', weight: 0.9 },
  advisor_to:       { color: '#c4794a',           weight: 1.6 },
  past_coworker:    { color: '#5a8c84',           weight: 1.4 },
  lab_collaborator: { color: '#7e5cad',           weight: 1.6 },
  mentor_of:        { color: '#3a6c93',           weight: 1.4 },
  cofounded_with:   { color: '#0c1525',           weight: 2.0 },
  investor_in:      { color: '#9c8b3c', dash: '4 3', weight: 1.4 },
  colleague:        { color: '#9aa0ad', dash: '1 3', weight: 0.9 },
};

interface Story {
  id: string;
  kicker: string;
  title: string;
  body: string;
  matcherCaught: string;
  highlightNodes: string[];
  highlightEdges?: (e: Edge) => boolean;
}

const STORIES: Story[] = [
  {
    id: 'recursion',
    kicker: 'The Recursion bench',
    title: 'Three ex-Recursion operators inside a 30-mile radius.',
    body: 'Sarah Chen, Lila Hashimoto, and others left Recursion in the last 24 months with deep pre-clinical and ML-bio chops. Most aren\'t looking on LinkedIn.',
    matcherCaught: 'When NeuroTouch said "we need someone who has cleared a Class III device," the matcher pulled Sarah first — because of her two prior FDA submissions, and a past_coworker edge to NeuroTouch\'s pre-clinical lead.',
    highlightNodes: ['t_sarah_chen', 't_lila_hashimoto', 'st_neurotouch'],
    highlightEdges: (e) => (e.from === 't_sarah_chen' && e.to === 't_lila_hashimoto') || (e.to === 't_sarah_chen' && e.from === 't_lila_hashimoto'),
  },
  {
    id: 'sarcos',
    kicker: 'The Sarcos diaspora',
    title: 'Robotics and exoskeleton operators flowing into Utah deep-tech.',
    body: 'Devon Park, Jenna Ryu, Yoel Haddad, Grace Lin — all share Sarcos in their past. They cluster naturally around defense + advanced manufacturing.',
    matcherCaught: 'For Aerolith Defense, the matcher surfaced four operators with overlapping Sarcos history. The advisor edge from Devon to Aerolith is the warm intro Nick would have surfaced manually — except now it\'s flagged automatically.',
    highlightNodes: ['t_devon_park', 't_jenna_ryu', 't_yoel_haddad', 't_grace_lin', 'st_aerolith'],
    highlightEdges: (e) => ['t_devon_park', 't_jenna_ryu', 't_yoel_haddad', 't_grace_lin'].includes(e.from) || ['t_devon_park', 't_jenna_ryu', 't_yoel_haddad', 't_grace_lin'].includes(e.to),
  },
  {
    id: 'byu-ag',
    kicker: 'BYU regenerative-ag pipeline',
    title: 'Dr. Hart → Mira Okonjo → TerraForm Ag.',
    body: 'A research-group advisor, her CS-meets-plant-sciences student, and the spinout that came out of the lab. Three nodes, two edges, one paragraph that LinkedIn can\'t generate.',
    matcherCaught: 'Mira shows up as TerraForm\'s top student match not because of keyword overlap — but because the matcher follows the mentor_of edge and flags the lab she came from as the same one TerraForm spun out of.',
    highlightNodes: ['t_dr_julia_hart', 't_mira_okonjo', 'st_terraform'],
    highlightEdges: (e) => ['t_dr_julia_hart', 't_mira_okonjo', 'st_terraform'].includes(e.from) && ['t_dr_julia_hart', 't_mira_okonjo', 'st_terraform'].includes(e.to),
  },
  {
    id: 'u-of-u',
    kicker: 'The U of U flywheel',
    title: 'One PI, one spinout, three operators.',
    body: 'Dr. Rashid Lee runs the lab where NeuroTouch was incubated. His former PhD student Priya Anand is now a senior engineer. Olivia Park overlapped with NeuroTouch founders at Boston Scientific.',
    matcherCaught: 'The matcher uses these as a "network" dimension boost — not just keyword scoring. Priya scores +20 on network because of the lab_collaborator edge and the institution overlap, even though her resume keywords aren\'t a perfect fit.',
    highlightNodes: ['t_dr_rashid_lee', 't_priya_anand', 't_olivia_park', 'st_neurotouch'],
    highlightEdges: (e) => ['t_dr_rashid_lee', 't_priya_anand', 't_olivia_park'].includes(e.from) || ['t_dr_rashid_lee', 't_priya_anand', 't_olivia_park'].includes(e.to),
  },
];

const EDGE_KIND_FILTERS = [
  { id: 'all',              label: 'All connections' },
  { id: 'advisor_to',       label: 'Advisors' },
  { id: 'past_coworker',    label: 'Past coworkers' },
  { id: 'lab_collaborator', label: 'Lab collaborators' },
  { id: 'mentor_of',        label: 'Mentors' },
  { id: 'investor_in',      label: 'Investors' },
];

export function Network() {
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>('recursion');
  const [edgeFilter, setEdgeFilter] = useState<string>('all');

  useEffect(() => {
    api.graph().then((g) => {
      runForceLayout(g);
      setGraph({ ...g });
    });
  }, []);

  const story = useMemo(() => STORIES.find((s) => s.id === storyId) ?? null, [storyId]);

  const nodeById = useMemo(() => new Map((graph?.nodes ?? []).map((n) => [n.id, n])), [graph]);

  const stats = useMemo(() => {
    if (!graph) return null;
    const talents = graph.nodes.filter((n) => n.kind === 'talent').length;
    const startups = graph.nodes.filter((n) => n.kind === 'startup').length;
    const inst = graph.nodes.filter((n) => n.kind === 'institution').length;
    const explicit = graph.edges.filter((e) => !['alumnus_of', 'origin'].includes(e.kind)).length;
    return { talents, startups, inst, explicit };
  }, [graph]);

  if (!graph) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <Sparkles className="w-5 h-5 mx-auto text-nucleus-accent animate-pulse" />
        <div className="text-nucleus-subtle text-sm mt-3">Mapping the Utah ecosystem…</div>
      </div>
    );
  }

  // Compute highlight set: story-driven first, otherwise selection-driven
  const highlightNodeSet = new Set<string>();
  if (story) story.highlightNodes.forEach((id) => highlightNodeSet.add(id));
  if (selected) {
    highlightNodeSet.add(selected);
    graph.edges.forEach((e) => {
      if (e.from === selected) highlightNodeSet.add(e.to);
      if (e.to === selected) highlightNodeSet.add(e.from);
    });
  }
  const hasHighlight = highlightNodeSet.size > 0;

  const isEdgeHighlighted = (e: Edge): boolean => {
    if (story?.highlightEdges?.(e)) return true;
    if (selected && (e.from === selected || e.to === selected)) return true;
    if (hover && (e.from === hover || e.to === hover)) return true;
    return false;
  };

  const passesEdgeFilter = (e: Edge): boolean => {
    if (edgeFilter === 'all') return true;
    return e.kind === edgeFilter;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-3xl md:text-4xl font-semibold">Inside the Utah ecosystem</h1>
          <p className="text-nucleus-subtle text-sm mt-1.5 max-w-2xl">
            The matcher doesn't just read profiles — it walks the network between them. Pick a story to see what it caught.
          </p>
        </div>
        {stats && (
          <div className="flex gap-4 md:gap-6 text-xs">
            <Stat label="Operators"    value={stats.talents} />
            <Stat label="Startups"     value={stats.startups} />
            <Stat label="Institutions" value={stats.inst} />
            <Stat label="Edges"        value={stats.explicit} />
          </div>
        )}
      </div>

      {/* Story chips */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STORIES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setStoryId(s.id === storyId ? null : s.id); setSelected(null); }}
            className={cn(
              'shrink-0 px-3.5 py-2 rounded-full border text-xs md:text-sm transition-all',
              storyId === s.id
                ? 'bg-nucleus-ink text-nucleus-cream border-nucleus-ink shadow-soft'
                : 'bg-white text-nucleus-ink border-nucleus-line/60 hover:border-nucleus-accent/60 hover:text-nucleus-ink',
            )}
          >
            {s.kicker}
          </button>
        ))}
        <div className="shrink-0 ml-auto flex items-center gap-2 text-xs text-nucleus-subtle">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={edgeFilter}
            onChange={(e) => setEdgeFilter(e.target.value)}
            className="bg-transparent border hairline rounded-md px-2 py-1.5 text-nucleus-ink text-xs"
          >
            {EDGE_KIND_FILTERS.map((f) => (<option key={f.id} value={f.id}>{f.label}</option>))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        {/* Graph */}
        <div className="card overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" className="block bg-nucleus-paper">
            {/* dot grid */}
            <defs>
              <pattern id="netdots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="rgba(12,21,37,.06)" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#netdots)" />

            {/* edges */}
            {graph.edges.map((e, i) => {
              const a = nodeById.get(e.from); const b = nodeById.get(e.to);
              if (!a || !b || a.x == null || b.x == null) return null;
              if (!passesEdgeFilter(e)) return null;
              const style = EDGE_STYLE[e.kind] ?? EDGE_STYLE.colleague;
              const hi = isEdgeHighlighted(e);
              const dimmed = hasHighlight && !hi;
              const baseOp = e.kind === 'alumnus_of' || e.kind === 'origin' ? 0.35 : 0.6;
              const op = dimmed ? 0.05 : (hi ? 1 : baseOp);
              const w = hi ? style.weight + 0.6 : style.weight;
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={hi ? style.color : (dimmed ? '#cbcfd6' : style.color)}
                  strokeWidth={w}
                  strokeDasharray={style.dash}
                  opacity={op}
                />
              );
            })}

            {/* nodes */}
            {graph.nodes.map((n) => {
              if (n.x == null) return null;
              const isHi = highlightNodeSet.has(n.id) || hover === n.id;
              const dimmed = hasHighlight && !isHi;
              const isInst = n.kind === 'institution';
              const sz = isInst ? 12 : n.kind === 'startup' ? 8 : 7;
              let fill = '#0c1525';
              if (n.kind === 'startup') fill = SECTOR_COLORS[n.sector ?? 'unknown'] ?? '#c4794a';
              else if (n.kind === 'institution') fill = '#5a8c84';
              const op = dimmed ? 0.18 : 1;
              return (
                <g
                  key={n.id}
                  opacity={op}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => { setSelected(selected === n.id ? null : n.id); setStoryId(null); }}
                  style={{ cursor: 'pointer' }}
                >
                  {isHi && !isInst && (
                    <circle cx={n.x} cy={n.y} r={sz + 6} fill={fill} opacity={0.18} />
                  )}
                  {n.kind === 'startup' ? (
                    <rect x={n.x! - sz} y={n.y! - sz} width={sz * 2} height={sz * 2} rx={2}
                          fill={fill} stroke="white" strokeWidth={isHi ? 2 : 1.4} />
                  ) : isInst ? (
                    <polygon points={polygonPoints(n.x!, n.y!, sz)}
                             fill={fill} stroke="white" strokeWidth={1.5} />
                  ) : (
                    <circle cx={n.x} cy={n.y} r={sz}
                            fill={fill} stroke="white" strokeWidth={isHi ? 2 : 1.4} />
                  )}
                  {(isHi || isInst) && (
                    <text x={n.x} y={n.y! + sz + 12} textAnchor="middle"
                          fontSize={isInst ? 11 : 10.5}
                          fontWeight={isInst ? 700 : isHi ? 600 : 500}
                          fill="#0c1525"
                          pointerEvents="none">
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="border-t hairline px-4 py-3 flex items-center gap-4 text-[11px] text-nucleus-subtle flex-wrap">
            <Legend color="#0c1525" shape="circle"  label="Operators" />
            <Legend color="#c4794a" shape="square"  label="Startups (sector-colored)" />
            <Legend color="#5a8c84" shape="diamond" label="Institutions" />
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className="inline-block w-5 h-px bg-nucleus-accent" />
              <span>advisor</span>
              <span className="inline-block w-5 h-px ml-2" style={{ background: '#5a8c84' }} />
              <span>past coworker</span>
              <span className="inline-block w-5 h-px ml-2" style={{ background: '#7e5cad' }} />
              <span>lab</span>
            </span>
          </div>
        </div>

        {/* Story / selection panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {story ? (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="card p-6"
              >
                <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
                  <NetworkIcon className="w-3 h-3" /> Story · {story.kicker}
                </div>
                <h2 className="display text-xl font-semibold mt-2 leading-snug">{story.title}</h2>
                <p className="text-sm text-nucleus-subtle mt-3 leading-relaxed">{story.body}</p>

                <div className="mt-4 rounded-lg bg-nucleus-cream border-l-4 border-l-nucleus-accent p-4">
                  <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> What the matcher caught
                  </div>
                  <p className="text-sm text-nucleus-ink mt-2 leading-relaxed">{story.matcherCaught}</p>
                </div>

                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mb-2">In this story</div>
                  <div className="flex flex-wrap gap-1.5">
                    {story.highlightNodes.map((id) => {
                      const n = nodeById.get(id);
                      if (!n) return null;
                      const href = n.kind === 'talent' ? `/talent/${id}` : n.kind === 'startup' ? `/startup/${id}` : null;
                      const inner = (
                        <span className={cn(
                          'pill-soft inline-flex items-center gap-1.5',
                          href && 'hover:bg-nucleus-cream cursor-pointer',
                        )}>
                          {n.kind === 'startup' ? '▣' : n.kind === 'institution' ? '◆' : '●'} {n.label}
                          {href && <ArrowRight className="w-3 h-3 text-nucleus-accent" />}
                        </span>
                      );
                      return href ? <Link key={id} to={href}>{inner}</Link> : <span key={id}>{inner}</span>;
                    })}
                  </div>
                </div>
              </motion.div>
            ) : selected && nodeById.get(selected) ? (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="card p-6"
              >
                <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">{pretty(nodeById.get(selected)!.kind)}</div>
                <div className="display text-xl font-semibold mt-1">{nodeById.get(selected)!.label}</div>
                {nodeById.get(selected)!.sublabel && (
                  <div className="text-sm text-nucleus-subtle mt-1.5 leading-relaxed">{nodeById.get(selected)!.sublabel}</div>
                )}

                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mb-2 inline-flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" /> Connections
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {graph.edges
                      .filter((e) => e.from === selected || e.to === selected)
                      .filter((e) => !['alumnus_of', 'origin'].includes(e.kind))
                      .map((e, i) => {
                        const otherId = e.from === selected ? e.to : e.from;
                        const other = nodeById.get(otherId);
                        return (
                          <li key={i} className="flex items-baseline gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: EDGE_STYLE[e.kind]?.color ?? '#9aa0ad' }}>
                              {pretty(e.kind)}
                            </span>
                            <span className="font-medium text-nucleus-ink">{other?.label ?? otherId}</span>
                            {e.evidence && <span className="text-nucleus-subtle italic"> — "{e.evidence}"</span>}
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {(nodeById.get(selected)!.kind === 'talent' || nodeById.get(selected)!.kind === 'startup') && (
                  <Link
                    to={nodeById.get(selected)!.kind === 'talent' ? `/talent/${selected}` : `/startup/${selected}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm text-nucleus-accent font-medium"
                  >
                    Open full profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-xs text-nucleus-subtle hover:text-nucleus-ink mt-4 block"
                >
                  Clear selection
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-6 border-dashed"
              >
                <div className="text-sm text-nucleus-subtle">Pick a story above, or click any node in the graph to see its connections.</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card p-5">
            <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">Why this matters</div>
            <p className="text-sm text-nucleus-ink mt-2 leading-relaxed">
              Every match has a <span className="font-semibold">network</span> dimension that walks edges like these.
              When two operators worked together at Sarcos, that's not a keyword — that's a 0.85-strength <code className="text-xs bg-nucleus-paper px-1 rounded">past_coworker</code> edge,
              and it boosts their score by up to 20 points for any company in adjacent space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="display text-xl md:text-2xl font-semibold tabular-nums text-nucleus-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">{label}</div>
    </div>
  );
}

function Legend({ color, shape, label }: { color: string; shape: 'circle' | 'square' | 'diamond'; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {shape === 'circle' && <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />}
      {shape === 'square' && <span className="w-2.5 h-2.5" style={{ background: color }} />}
      {shape === 'diamond' && <span className="w-2.5 h-2.5 rotate-45" style={{ background: color }} />}
      {label}
    </span>
  );
}

function polygonPoints(cx: number, cy: number, r: number) {
  return [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ].map((p) => p.join(',')).join(' ');
}

// Deterministic hash → [0,1) seed so layout is stable run-to-run.
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function runForceLayout(graph: { nodes: Node[]; edges: Edge[] }) {
  const N = graph.nodes;
  // Pre-place institutions on the perimeter — they're the gravitational anchors.
  const insts = N.filter((n) => n.kind === 'institution');
  insts.forEach((n, i) => {
    const t = (i / Math.max(1, insts.length)) * Math.PI * 2;
    n.x = W / 2 + Math.cos(t) * (W * 0.36);
    n.y = H / 2 + Math.sin(t) * (H * 0.38);
    n.vx = 0; n.vy = 0;
  });
  // Everything else: deterministic seeded position based on id hash.
  for (const n of N) {
    if (n.kind === 'institution') continue;
    n.x = 80 + hash01(n.id + 'x') * (W - 160);
    n.y = 80 + hash01(n.id + 'y') * (H - 160);
    n.vx = 0; n.vy = 0;
  }
  const idxById = new Map(N.map((n, i) => [n.id, i]));
  const k = 0.014;
  const repel = 1500;
  const damp = 0.85;
  for (let step = 0; step < 260; step++) {
    for (let i = 0; i < N.length; i++) {
      for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j];
        let dx = a.x! - b.x!, dy = a.y! - b.y!;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) d2 = 1;
        const f = repel / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        // Pin institutions in place.
        if (a.kind !== 'institution') { a.vx! += fx; a.vy! += fy; }
        if (b.kind !== 'institution') { b.vx! -= fx; b.vy! -= fy; }
      }
    }
    for (const e of graph.edges) {
      const a = N[idxById.get(e.from)!]; const b = N[idxById.get(e.to)!];
      if (!a || !b) continue;
      const dx = b.x! - a.x!, dy = b.y! - a.y!;
      const sk = e.kind === 'alumnus_of' || e.kind === 'origin' ? k * 1.4 : k;
      if (a.kind !== 'institution') { a.vx! += dx * sk; a.vy! += dy * sk; }
      if (b.kind !== 'institution') { b.vx! -= dx * sk; b.vy! -= dy * sk; }
    }
    for (const n of N) {
      if (n.kind === 'institution') continue;
      n.vx! += (W / 2 - n.x!) * 0.0012;
      n.vy! += (H / 2 - n.y!) * 0.0012;
      n.vx! *= damp; n.vy! *= damp;
      n.x! += n.vx!; n.y! += n.vy!;
      n.x = Math.max(20, Math.min(W - 20, n.x!));
      n.y = Math.max(20, Math.min(H - 30, n.y!));
    }
  }
}
