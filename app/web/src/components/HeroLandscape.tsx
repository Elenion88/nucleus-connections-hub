// Auto-cycling hero visualization. Replaces the abstract 2D-PCA scatter with
// the same Network Bridge view used on detail pages — cycles through three
// flagship startups, painting each one's bridges + top matches in real time.
// Reads as: "judges, here's the matcher's reasoning on a real Utah company."

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { api, pipe, type Talent, type Startup, type MatchDimensions } from '@/lib/api';
import { BridgeView, type BridgeEdge } from '@/components/BridgeView.tsx';

const FLAGSHIPS = [
  { id: 'st_neurotouch', label: 'NeuroTouch Bio',   blurb: 'Implantable neural interface that lets prosthetics feel touch.' },
  { id: 'st_silicell',   label: 'SiliCell Compute', blurb: 'Silicon scaffolds populated with cultured neuronal tissue.' },
  { id: 'st_aerolith',   label: 'Aerolith Defense', blurb: 'Autonomous swarm logistics for contested-environment resupply.' },
];

const CYCLE_MS = 8000;

interface ScoredTalent { talent: Talent; score: number; dimensions: MatchDimensions; rank: number; total: number }

export function HeroLandscape() {
  const [cycleIdx, setCycleIdx] = useState(0);
  const [edges, setEdges] = useState<BridgeEdge[]>([]);
  const [startups, setStartups] = useState<Record<string, Startup>>({});
  const [matchesByStartup, setMatchesByStartup] = useState<Record<string, ScoredTalent[]>>({});

  // Load graph edges + each flagship's startup record + top matches once
  useEffect(() => {
    api.graph().then((g) => setEdges(g.edges)).catch(() => {});
    FLAGSHIPS.forEach((f) => {
      api.startup(f.id).then((s) => {
        setStartups((prev) => ({ ...prev, [f.id]: s }));
      }).catch(() => {});
      api.matchesForStartup(f.id, 5).then((r) => {
        setMatchesByStartup((prev) => ({ ...prev, [f.id]: r.matches }));
      }).catch(() => {});
    });
  }, []);

  // Cycle the focal
  useEffect(() => {
    const t = setInterval(() => setCycleIdx((i) => (i + 1) % FLAGSHIPS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const current = FLAGSHIPS[cycleIdx];
  const startup = startups[current.id];
  const matches = matchesByStartup[current.id] ?? [];
  const ready = !!startup && matches.length > 0;

  const focal = useMemo(() => startup ? {
    id: startup.id,
    name: startup.name,
    kind: 'startup' as const,
    affiliations: pipe(startup.utahRoots),
    sectors: [startup.sector],
    mission: pipe(startup.missionTags),
  } : null, [startup]);

  const bridgeMatches = useMemo(() => matches.slice(0, 5).map((m) => ({
    id: m.talent.id,
    name: m.talent.name,
    kind: 'talent' as const,
    rank: m.rank,
    score: m.score,
    affiliations: pipe(m.talent.affiliations),
    sectors: pipe(m.talent.sectors),
    mission: pipe(m.talent.missionTags),
  })), [matches]);

  const focalEdges = useMemo(
    () => edges.filter((e) => e.from === current.id || e.to === current.id),
    [edges, current.id],
  );

  return (
    <div className="relative">
      {/* Caption strip above the chart */}
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
          <span className="font-semibold text-nucleus-ink">{current.label}</span> ·{' '}
          <span className="hidden sm:inline">{current.blurb}</span>
        </motion.span>
      </div>

      {/* The bridge view — re-keyed so it remounts on cycle and animations replay */}
      <div className="relative">
        {ready && focal ? (
          <BridgeView
            key={current.id}
            focal={focal}
            matches={bridgeMatches}
            edges={focalEdges}
            compact
          />
        ) : (
          <div className="rounded-xl2 border hairline bg-white aspect-[960/480] flex items-center justify-center text-nucleus-subtle text-sm">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Loading the Utah landscape…
          </div>
        )}
      </div>

      {/* Top match preview chips beneath the chart */}
      <div className="mt-3 min-h-[28px]">
        <motion.div
          key={cycleIdx + '-top'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex items-center gap-2 flex-wrap text-xs text-nucleus-subtle"
        >
          <span className="text-[10px] uppercase tracking-widest">top operators surfaced</span>
          {matches.slice(0, 3).map((m) => (
            <span key={m.talent.id} className="pill-soft">{m.talent.name}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
