import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, pipe, pretty, type Talent, type Startup, type MatchDimensions } from '@/lib/api';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';
import { ScoreDonut } from '@/components/ScoreDonut.tsx';
import { MatchExplainDrawer } from '@/components/MatchExplainDrawer.tsx';
import { MiniRadar } from '@/components/MiniRadar.tsx';
import { FitMap } from '@/components/FitMap.tsx';
import { toast } from '@/components/Toast.tsx';

interface ScoredStartup { startup: Startup; score: number; dimensions: MatchDimensions; rank: number; total: number }

export function TalentDetail() {
  const { id } = useParams();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [matches, setMatches] = useState<ScoredStartup[]>([]);
  const [activeStartup, setActiveStartup] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.talent(id).then(setTalent).catch((e) => toast(`Couldn't load profile: ${(e as Error).message}`, 'error'));
    api.matchesForTalent(id, 25).then((r) => setMatches(r.matches)).catch((e) => toast(`Couldn't load matches: ${(e as Error).message}`, 'error'));
  }, [id]);

  if (!talent) return <div className="max-w-6xl mx-auto px-6 py-10 text-nucleus-subtle">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Avatar name={talent.name} seed={talent.photoSeed} size={56} />
              <div>
                <h1 className="display text-xl font-semibold">{talent.name}</h1>
                <div className="text-xs text-nucleus-subtle">{talent.location}</div>
              </div>
            </div>
            <p className="text-sm text-nucleus-ink mt-3">{talent.headline}</p>
            <p className="text-sm text-nucleus-subtle mt-3 leading-relaxed">{talent.bio}</p>
          </div>

          <div className="card p-6 space-y-3">
            <FactRow label="Role" value={pretty(talent.roleType)} />
            <FactRow label="Availability" value={pretty(talent.availability)} />
            <FactRow label="Years experience" value={String(talent.yearsExperience)} />
            <FactRow label="Risk tolerance" value={pretty(talent.riskTolerance)} />
            <FactRow label="Stage preference" value={pipe(talent.stagePreference).map(pretty).join(', ')} />
            <FactRow label="Comp shape" value={pipe(talent.compShape).map(pretty).join(', ')} />
            <FactGroup label="Sectors" pills={pipe(talent.sectors)} />
            <FactGroup label="Skills" pills={pipe(talent.skills)} />
            <FactGroup label="Mission" pills={pipe(talent.missionTags)} variant="sage" />
            <FactGroup label="Affiliations" pills={pipe(talent.affiliations)} />
          </div>
        </aside>

        <section className="md:col-span-2">
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="display text-xl font-semibold">Fit map</h2>
              <span className="text-xs text-nucleus-subtle hidden md:inline">Skills fit (X) · Sector fit (Y) — top-right is the bullseye</span>
            </div>
            {talent && matches.length > 0 && (
              <FitMap
                focalLabel={talent.name}
                focalKind="talent"
                candidates={matches.slice(0, 18).map((m, i) => ({
                  id: m.startup.id,
                  label: m.startup.name,
                  skills: m.dimensions.skills,
                  sector: m.dimensions.sector,
                  score: m.score,
                  rank: m.rank,
                  highlight: i < 5,
                }))}
              />
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl font-semibold">Top matches</h2>
            <span className="text-xs text-nucleus-subtle">Tap a match to see the per-dimension breakdown.</span>
          </div>

          <div className="mt-4 space-y-3">
            {matches.length > 0 && matches[0].score < 65 && (
              <div className="card p-4 border-l-4 border-l-nucleus-accent2 bg-nucleus-cream/40 text-sm">
                <div className="font-semibold">No strong matches yet.</div>
                <div className="text-nucleus-subtle mt-1">Top score is {matches[0].score}, below our 65 threshold for "high-confidence." Consider broadening sectors or stage preference, or ask Nucleus to flag you for new startups as they sign up.</div>
              </div>
            )}
            {matches.slice(0, 5).map((m) => (
              <button
                key={m.startup.id}
                onClick={() => setActiveStartup(m.startup.id)}
                className="card p-4 md:p-5 hover:shadow-lg transition-shadow w-full text-left flex items-start md:items-center gap-3 md:gap-4"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ScoreDonut score={m.score} size={52} />
                  <span className="text-[9px] uppercase tracking-widest text-nucleus-subtle">{rankLabel(m.rank, m.total)}</span>
                </div>
                <StartupLogo name={m.startup.name} seed={m.startup.logoSeed} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="display font-semibold text-base md:text-lg">{m.startup.name}</h3>
                    <span className="pill-soft">{pretty(m.startup.sector)}</span>
                    <span className="pill-soft hidden sm:inline-flex">{pretty(m.startup.fundingStage)}</span>
                  </div>
                  <p className="text-sm text-nucleus-subtle mt-1 line-clamp-2">{m.startup.oneliner}</p>
                </div>
                <div className="hidden md:flex items-center shrink-0" title="Skills · Sector · Stage · Mission · Network">
                  <MiniRadar data={radarFromDim(m.dimensions)} size={64} />
                </div>
                <div className="text-nucleus-accent text-sm font-medium shrink-0 hidden sm:block">Why? →</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {activeStartup && (
        <MatchExplainDrawer
          talentId={talent.id}
          startupId={activeStartup}
          open={!!activeStartup}
          onOpenChange={(open) => { if (!open) setActiveStartup(null); }}
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

function FactGroup({ label, pills, variant = 'soft' }: { label: string; pills: string[]; variant?: 'soft' | 'sage' }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-nucleus-subtle mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <span key={p} className={variant === 'sage' ? 'pill-sage' : 'pill-soft'}>
            {pretty(p)}
          </span>
        ))}
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
