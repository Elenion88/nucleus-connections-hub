import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, pipe, pretty, type Talent, type Startup, type MatchDimensions } from '@/lib/api';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';
import { ScoreDonut } from '@/components/ScoreDonut.tsx';
import { MatchExplainDrawer } from '@/components/MatchExplainDrawer.tsx';
import { MiniRadar } from '@/components/MiniRadar.tsx';
import { BridgeView, type BridgeEdge } from '@/components/BridgeView.tsx';
import { toast } from '@/components/Toast.tsx';
import { Send } from 'lucide-react';

interface ScoredTalent { talent: Talent; score: number; dimensions: MatchDimensions; rank: number; total: number }

export function StartupDetail() {
  const { id } = useParams();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [matches, setMatches] = useState<ScoredTalent[]>([]);
  const [activeTalent, setActiveTalent] = useState<string | null>(null);
  const [edges, setEdges] = useState<BridgeEdge[]>([]);
  const [bridgeFilter, setBridgeFilter] = useState<{ id: string; label: string; matchIds: string[] } | null>(null);
  const [introsForFocal, setIntrosForFocal] = useState<Map<string, string>>(new Map()); // talentId → status

  useEffect(() => {
    if (!id) return;
    api.startup(id).then(setStartup).catch((e) => toast(`Couldn't load startup: ${(e as Error).message}`, 'error'));
    api.matchesForStartup(id, 50).then((r) => setMatches(r.matches)).catch((e) => toast(`Couldn't load matches: ${(e as Error).message}`, 'error'));
    api.graph().then((g) => setEdges(g.edges)).catch(() => {});
    refreshIntros();
  }, [id]);

  function refreshIntros() {
    if (!id) return;
    api.intros().then((all) => {
      const map = new Map<string, string>();
      for (const i of all) if (i.startupId === id) map.set(i.talentId, i.status);
      setIntrosForFocal(map);
    }).catch(() => {});
  }

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
              <h2 className="display text-xl font-semibold">Network bridge</h2>
              <span className="text-xs text-nucleus-subtle hidden md:inline">Why each top candidate connects — institutions · sectors · missions · direct edges</span>
            </div>
            {startup && matches.length > 0 && (
              <BridgeView
                focal={{
                  id: startup.id,
                  name: startup.name,
                  kind: 'startup',
                  affiliations: pipe(startup.utahRoots),
                  sectors: [startup.sector],
                  mission: pipe(startup.missionTags),
                }}
                matches={matches.slice(0, 5).map((m) => ({
                  id: m.talent.id,
                  name: m.talent.name,
                  kind: 'talent',
                  rank: m.rank,
                  score: m.score,
                  affiliations: pipe(m.talent.affiliations),
                  sectors: pipe(m.talent.sectors),
                  mission: pipe(m.talent.missionTags),
                  roleLabel: pretty(m.talent.roleType),
                }))}
                edges={edges.filter((e) => e.from === startup.id || e.to === startup.id)}
                onSelectBridge={setBridgeFilter}
              />
            )}
          </div>

          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="display text-2xl font-semibold">Top talent matches</h2>
            {bridgeFilter ? (
              <span className="text-xs text-nucleus-ink">
                Filtered to <span className="font-semibold">{bridgeFilter.label}</span> · {bridgeFilter.matchIds.length} match{bridgeFilter.matchIds.length === 1 ? '' : 'es'}
                <button onClick={() => setBridgeFilter(null)} className="ml-2 underline text-nucleus-subtle hover:text-nucleus-ink">clear</button>
              </span>
            ) : (
              <span className="text-xs text-nucleus-subtle">Click any candidate to see why.</span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {matches.length > 0 && matches[0].score < 65 && (
              <div className="card p-4 border-l-4 border-l-nucleus-accent2 bg-nucleus-cream/40 text-sm">
                <div className="font-semibold">No strong matches yet.</div>
                <div className="text-nucleus-subtle mt-1">Top score is {matches[0].score}, below our 65 threshold for "high-confidence." Consider broadening immediate needs, or wait — we'll notify you as new candidates sign up.</div>
              </div>
            )}
            {matches.slice(0, 6).map((m) => {
              const inFilter = !bridgeFilter || bridgeFilter.matchIds.includes(m.talent.id);
              const introStatus = introsForFocal.get(m.talent.id);
              return (
              <button
                key={m.talent.id}
                onClick={() => setActiveTalent(m.talent.id)}
                className={`card p-4 md:p-5 hover:shadow-lg transition-all w-full text-left flex items-start md:items-center gap-3 md:gap-4 ${inFilter ? '' : 'opacity-30 hover:opacity-60'}`}
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
                    {introStatus && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-nucleus-accent2/15 text-nucleus-accent2">
                        <Send className="w-2.5 h-2.5" /> Intro {introStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-nucleus-subtle mt-1 line-clamp-2">{m.talent.headline}</p>
                </div>
                <div className="hidden md:flex items-center shrink-0" title="Skills · Sector · Stage · Mission · Network">
                  <MiniRadar data={radarFromDim(m.dimensions)} size={64} />
                </div>
                <div className="text-nucleus-accent text-sm font-medium shrink-0 hidden sm:block">Why? →</div>
              </button>
              );
            })}
          </div>
        </section>
      </div>

      {activeTalent && (
        <MatchExplainDrawer
          talentId={activeTalent}
          startupId={startup.id}
          open={!!activeTalent}
          onOpenChange={(open) => { if (!open) { setActiveTalent(null); refreshIntros(); } }}
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

function radarFromDim(dim: MatchDimensions) {
  return [
    { label: 'Skills', value: dim.skills },
    { label: 'Sector', value: dim.sector },
    { label: 'Stage', value: dim.stage },
    { label: 'Mission', value: dim.mission },
    { label: 'Network', value: dim.network },
  ];
}
