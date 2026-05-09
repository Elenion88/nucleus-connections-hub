import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, pipe, pretty, type Talent, type Startup, type MatchDimensions } from '@/lib/api';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';
import { ScoreDonut } from '@/components/ScoreDonut.tsx';
import { MatchExplainDrawer } from '@/components/MatchExplainDrawer.tsx';
import { LandscapeMap } from '@/components/LandscapeMap.tsx';
import { toast } from '@/components/Toast.tsx';

interface ScoredTalent { talent: Talent; score: number; dimensions: MatchDimensions; rank: number; total: number }

export function StartupDetail() {
  const { id } = useParams();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [matches, setMatches] = useState<ScoredTalent[]>([]);
  const [activeTalent, setActiveTalent] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.startup(id).then(setStartup).catch((e) => toast(`Couldn't load startup: ${(e as Error).message}`, 'error'));
    api.matchesForStartup(id, 6).then((r) => setMatches(r.matches)).catch((e) => toast(`Couldn't load matches: ${(e as Error).message}`, 'error'));
  }, [id]);

  if (!startup) return <div className="max-w-6xl mx-auto px-6 py-10 text-nucleus-subtle">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <StartupLogo name={startup.name} seed={startup.logoSeed} size={56} />
              <div>
                <h1 className="display text-xl font-semibold">{startup.name}</h1>
                <div className="text-xs text-nucleus-subtle">{startup.location}</div>
              </div>
            </div>
            <p className="text-sm text-nucleus-ink mt-3">{startup.oneliner}</p>
            <p className="text-sm text-nucleus-subtle mt-3 leading-relaxed">{startup.description}</p>
          </div>

          <div className="card p-6 space-y-3">
            <FactRow label="Sector" value={pretty(startup.sector)} />
            <FactRow label="Origin" value={pretty(startup.origin)} />
            <FactRow label="TRL" value={startup.trl ? String(startup.trl) : '—'} />
            <FactRow label="Stage" value={pretty(startup.fundingStage)} />
            <FactRow label="Raised" value={startup.fundingRaisedUsd ? `$${(startup.fundingRaisedUsd / 1_000_000).toFixed(1)}M` : '—'} />
            <FactRow label="Sources" value={pipe(startup.fundingSources ?? '').map(pretty).join(', ') || '—'} />
            <FactGroup label="Immediate needs" pills={pipe(startup.immediateNeeds)} variant="accent" />
            <FactGroup label="Mission" pills={pipe(startup.missionTags)} variant="sage" />
            <FactGroup label="Utah roots" pills={pipe(startup.utahRoots)} />
          </div>
        </aside>

        <section className="md:col-span-2">
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="display text-xl font-semibold">Match landscape</h2>
              <span className="text-xs text-nucleus-subtle hidden md:inline">2D PCA of all 53 profiles · top matches pulse copper</span>
            </div>
            {startup && matches.length > 0 && (
              <LandscapeMap
                focalId={startup.id}
                highlightedIds={matches.map((m) => m.talent.id)}
                height={300}
              />
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl font-semibold">Top talent matches</h2>
            <span className="text-xs text-nucleus-subtle">Click any candidate to see why.</span>
          </div>

          <div className="mt-4 space-y-3">
            {matches.length > 0 && matches[0].score < 65 && (
              <div className="card p-4 border-l-4 border-l-nucleus-accent2 bg-nucleus-cream/40 text-sm">
                <div className="font-semibold">No strong matches yet.</div>
                <div className="text-nucleus-subtle mt-1">Top score is {matches[0].score}, below our 65 threshold for "high-confidence." Consider broadening immediate needs, or wait — we'll notify you as new operators sign up.</div>
              </div>
            )}
            {matches.map((m) => (
              <button
                key={m.talent.id}
                onClick={() => setActiveTalent(m.talent.id)}
                className="card p-4 md:p-5 hover:shadow-lg transition-shadow w-full text-left flex items-start md:items-center gap-3 md:gap-4"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ScoreDonut score={m.score} size={52} />
                  <span className="text-[9px] uppercase tracking-widest text-nucleus-subtle">{rankLabel(m.rank, m.total)}</span>
                </div>
                <Avatar name={m.talent.name} seed={m.talent.photoSeed} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="display font-semibold text-base md:text-lg">{m.talent.name}</h3>
                    <span className="pill-soft">{pretty(m.talent.roleType)}</span>
                    <span className="pill-soft hidden sm:inline-flex">{pretty(m.talent.availability)}</span>
                  </div>
                  <p className="text-sm text-nucleus-subtle mt-1 line-clamp-2">{m.talent.headline}</p>
                  <DimensionBars dim={m.dimensions} />
                </div>
                <div className="text-nucleus-accent text-sm font-medium shrink-0 hidden sm:block">Why? →</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {activeTalent && (
        <MatchExplainDrawer
          talentId={activeTalent}
          startupId={startup.id}
          open={!!activeTalent}
          onOpenChange={(open) => { if (!open) setActiveTalent(null); }}
        />
      )}
    </div>
  );
}

function rankLabel(rank: number, total: number): string {
  if (rank === 1) return 'Strongest';
  if (rank === 2) return 'Runner-up';
  const pct = Math.round((rank / total) * 100);
  return `Top ${pct}%`;
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-nucleus-subtle">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function FactGroup({ label, pills, variant = 'soft' }: { label: string; pills: string[]; variant?: 'soft' | 'sage' | 'accent' }) {
  const cls = variant === 'sage' ? 'pill-sage' : variant === 'accent' ? 'pill-accent' : 'pill-soft';
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-nucleus-subtle mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((p) => (<span key={p} className={cls}>{pretty(p)}</span>))}
      </div>
    </div>
  );
}

function DimensionBars({ dim }: { dim: MatchDimensions }) {
  const items = [
    { l: 'Skills', v: dim.skills },
    { l: 'Sector', v: dim.sector },
    { l: 'Stage', v: dim.stage },
    { l: 'Mission', v: dim.mission },
    { l: 'Network', v: dim.network },
  ];
  return (
    <div className="mt-3 grid grid-cols-5 gap-2">
      {items.map((i) => (
        <div key={i.l} className="text-[10px]">
          <div className="text-nucleus-subtle uppercase tracking-widest">{i.l}</div>
          <div className="h-1.5 bg-nucleus-line rounded mt-1 overflow-hidden">
            <div className="h-full bg-nucleus-accent" style={{ width: `${i.v}%` }} />
          </div>
          <div className="text-right tabular-nums text-nucleus-subtle mt-0.5">{i.v}</div>
        </div>
      ))}
    </div>
  );
}
