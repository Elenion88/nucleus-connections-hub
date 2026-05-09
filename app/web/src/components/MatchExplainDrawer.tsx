// "Why matched" drawer. Hierarchy:
//   1. Hero sentence (the single sharpest reason).
//   2. Why bullets (3) + Gap bullets — primary content.
//   3. Network bridge — primary if present.
//   4. Talking points — primary.
//   5. Score donut + per-dim breakdown — collapsible "details" disclosure.
//   6. Profile facts — collapsible.
// Anything below #4 is supporting; the bullets are the product.

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { api, pipe, pretty, type MatchExplain, type MatchSuggestion } from '@/lib/api';
import { Avatar, StartupLogo } from './Avatar.tsx';
import { ScoreDonut } from './ScoreDonut.tsx';
import { RadarFit } from './RadarFit.tsx';
import { Sparkles, Brain, Network as NetworkIcon, Telescope, Loader2, Send, ChevronDown, Target, Mail, Check, Plus, Copy } from 'lucide-react';
import { toast } from './Toast.tsx';
import { roadmap } from '@/lib/roadmap';

interface Props {
  talentId: string;
  startupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExistingIntro { id: string; status: string; message?: string }

export function MatchExplainDrawer({ talentId, startupId, open, onOpenChange }: Props) {
  const [data, setData] = useState<MatchExplain | null>(null);
  const [path, setPath] = useState<{ node: string; kind?: string; evidence?: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingIntro, setExistingIntro] = useState<ExistingIntro | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFacts, setShowFacts] = useState(false);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setPath(null);
    setExistingIntro(null);
    setShowDetails(false);
    setShowFacts(false);
    setLoading(true);
    Promise.all([
      api.explain(talentId, startupId),
      api.pathBetween(talentId, startupId).catch(() => ({ path: null })),
      api.intros().catch(() => []),
    ])
      .then(([explain, p, intros]) => {
        setData(explain);
        setPath(p.path ?? null);
        if (Array.isArray(intros)) {
          const found = intros.find((i) => i.talentId === talentId && i.startupId === startupId);
          if (found) setExistingIntro({ id: found.id, status: found.status, message: found.message });
        }
      })
      .catch((e) => toast(`Couldn't load match: ${(e as Error).message}`, 'error'))
      .finally(() => setLoading(false));
  }, [open, talentId, startupId]);

  const radar = data
    ? [
        { label: 'Skills', value: data.dimensions.skills },
        { label: 'Sector', value: data.dimensions.sector },
        { label: 'Stage', value: data.dimensions.stage },
        { label: 'Mission', value: data.dimensions.mission },
        { label: 'Network', value: data.dimensions.network },
      ]
    : [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-nucleus-ink/40 z-40" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full md:w-[640px] bg-nucleus-cream z-50 shadow-2xl flex flex-col">
          <Dialog.Title className="sr-only">Why matched</Dialog.Title>
          <Dialog.Description className="sr-only">Per-dimension explanation of this Nucleus match.</Dialog.Description>

          {/* Compact identity strip */}
          <div className="px-5 md:px-6 py-4 border-b hairline bg-nucleus-paper">
            {data ? (
              <div className="flex items-center gap-3">
                <Avatar name={data.talent!.name} seed={data.talent!.photoSeed} size={40} />
                <div className="text-xl text-nucleus-subtle">↔</div>
                <StartupLogo name={data.startup!.name} seed={data.startup!.logoSeed} size={40} />
                <div className="ml-auto flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">Match score</div>
                    <div className="text-xs text-nucleus-subtle">Top of 35 candidates</div>
                  </div>
                  <ScoreDonut score={data.score} size={48} />
                </div>
              </div>
            ) : (
              <div className="h-10 flex items-center text-nucleus-subtle gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Computing match…
              </div>
            )}
            {data && (
              <div className="mt-3">
                <div className="display text-base font-semibold">
                  {data.talent!.name} <span className="text-nucleus-subtle font-normal">↔</span> {data.startup!.name}
                </div>
                <p className="text-xs text-nucleus-subtle mt-0.5 line-clamp-1">
                  {data.talent!.headline} · {data.startup!.oneliner}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto px-5 md:px-6 py-5 md:py-6 space-y-6">
            {loading && !data && (
              <div className="flex flex-col items-center justify-center text-nucleus-subtle gap-2 py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Asking Claude to write the explanation…</span>
              </div>
            )}
            {data && (
              <>
                {/* HERO: the one sentence */}
                {data.headline && (
                  <div className="card bg-nucleus-paper p-5 border-l-4 border-l-nucleus-accent">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 mt-0.5 text-nucleus-accent shrink-0" />
                      <div className="display text-base md:text-lg font-medium leading-snug">
                        {data.headline}
                      </div>
                    </div>
                  </div>
                )}

                {/* The numbers: radar + bars + upskilling lift, all together so the
                    quantitative picture lives in one panel. */}
                <div className="card p-5 md:p-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-nucleus-subtle mb-3">
                    <Telescope className="w-3.5 h-3.5" />
                    <span>Per-dimension breakdown</span>
                    <span className="ml-auto text-nucleus-subtle font-normal normal-case tracking-normal hidden sm:inline">Skills · Sector · Stage · Mission · Network</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4 items-center">
                    <div>
                      <RadarFit data={radar} size={200} />
                      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-nucleus-subtle">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-1.5 bg-nucleus-accent rounded-sm" />
                          This match
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 border-t border-dashed border-nucleus-accent2" />
                          Ideal candidate
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {radar.map((r) => (
                        <div key={r.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-nucleus-subtle text-xs">{r.label}</span>
                            <span className="font-semibold tabular-nums">
                              {r.value}<span className="text-nucleus-subtle font-normal text-[10px]">/100</span>
                            </span>
                          </div>
                          <div className="h-1 bg-nucleus-line rounded overflow-hidden">
                            <div className="h-full bg-nucleus-accent" style={{ width: `${r.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <UpskillingCalcOut score={data.score} dim={data.dimensions} />
                  </div>
                </div>

                {/* Positive evidence */}
                <Section title="Why it works" icon={<Sparkles className="w-3.5 h-3.5" />}>
                  <ul className="space-y-2.5 text-sm">
                    {data.whyBullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-nucleus-accent shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </Section>

                {/* Negative evidence — purely qualitative now; the quantitative lift moved up */}
                {data.gaps.length > 0 && (
                  <Section title="Where it falls short" icon={<Brain className="w-3.5 h-3.5" />}>
                    <ul className="space-y-2.5 text-sm">
                      {data.gaps.map((b, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-nucleus-accent2 shrink-0" />
                          <span className="text-nucleus-ink">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Provenance */}
                {path && path.length > 1 && (
                  <Section title="How you're connected" icon={<NetworkIcon className="w-3.5 h-3.5" />}>
                    <NetworkPath path={path} />
                  </Section>
                )}

                {/* PRIMARY: talking points */}
                {data.talkingPoints.length > 0 && (
                  <Section title="Suggested intro talking points" icon={<Sparkles className="w-3.5 h-3.5" />}>
                    <ul className="space-y-2.5 text-sm">
                      {data.talkingPoints.map((b, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-1 text-nucleus-accent">→</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* COLLAPSIBLE: profile facts */}
                <Disclosure
                  open={showFacts}
                  onToggle={() => setShowFacts((v) => !v)}
                  title="Profile facts"
                  hint="Roles, sectors, comp shape, immediate needs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <FactPanel label="Talent">
                      <Tag>Role · {pretty(data.talent!.roleType)}</Tag>
                      <Tag>Avail · {pretty(data.talent!.availability)}</Tag>
                      {pipe(data.talent!.sectors).slice(0, 3).map((s) => <Tag key={s}>{pretty(s)}</Tag>)}
                      {pipe(data.talent!.affiliations).slice(0, 3).map((s) => <Tag key={s}>{pretty(s)}</Tag>)}
                    </FactPanel>
                    <FactPanel label="Startup">
                      <Tag>Sector · {pretty(data.startup!.sector)}</Tag>
                      <Tag>Stage · {pretty(data.startup!.fundingStage)}</Tag>
                      {pipe(data.startup!.immediateNeeds).slice(0, 3).map((s) => <Tag key={s}>need: {pretty(s)}</Tag>)}
                      {pipe(data.startup!.utahRoots).slice(0, 2).map((s) => <Tag key={s}>{pretty(s)}</Tag>)}
                    </FactPanel>
                  </div>
                </Disclosure>

                {/* ACTION-ORIENTED: paired with the footer's "Request intro" button */}
                {data.suggestions && data.suggestions.length > 0 && (
                  <CloseTheGap talentId={talentId} startupId={startupId} suggestions={data.suggestions} score={data.score} />
                )}
                {data.outreachDraft && (
                  <DraftIntro
                    talentId={talentId}
                    startupId={startupId}
                    talent={data.talent?.name ?? 'you'}
                    startup={data.startup?.name ?? 'them'}
                    draft={data.outreachDraft}
                    existing={existingIntro}
                    onSubmitted={(intro) => setExistingIntro(intro)}
                  />
                )}
              </>
            )}
          </div>

          <div className="border-t hairline px-5 md:px-6 py-4 bg-nucleus-paper flex items-center justify-between gap-3">
            <div className="text-xs text-nucleus-subtle">
              {existingIntro ? (
                <span className="inline-flex items-center gap-1.5 text-nucleus-accent2 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Intro {existingIntro.status === 'introduced' ? 'introduced' : existingIntro.status === 'declined' ? 'declined' : 'submitted to Nucleus'}
                </span>
              ) : (
                <span>Submit your draft below — Nucleus reviews and forwards.</span>
              )}
            </div>
            <Dialog.Close className="btn-outline">Close</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-nucleus-subtle mb-2.5">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Disclosure({
  open, onToggle, title, hint, icon, children,
}: { open: boolean; onToggle: () => void; title: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-nucleus-cream/50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-nucleus-subtle">
          {icon}
          {title}
        </div>
        {hint && !open && <span className="text-xs text-nucleus-subtle truncate flex-1">{hint}</span>}
        <ChevronDown className={`w-4 h-4 text-nucleus-subtle transition-transform ml-auto ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="pill-soft">{children}</span>;
}

function FactPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border hairline rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function NetworkPath({ path }: { path: { node: string; kind?: string; evidence?: string }[] }) {
  return (
    <div className="bg-white border hairline rounded-lg p-3.5 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        {path.map((n, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="pill-sage">{prettyNode(n.node)}</span>
            {i < path.length - 1 && (
              <span className="text-nucleus-subtle text-[10px] uppercase tracking-widest">
                {path[i + 1]?.kind ? pretty(path[i + 1].kind ?? '') : ''} →
              </span>
            )}
          </span>
        ))}
      </div>
      {path[1]?.evidence && (
        <div className="mt-2 text-xs text-nucleus-subtle italic">"{path[1].evidence}"</div>
      )}
    </div>
  );
}

function prettyNode(id: string) {
  const map: Record<string, string> = {
    u_of_u: 'University of Utah',
    byu: 'BYU',
    usu: 'Utah State',
    silicon_slopes: 'Silicon Slopes',
    park_city: 'Park City',
    recursion: 'Recursion',
    sarcos: 'Sarcos',
    domo: 'Domo',
    pluralsight: 'Pluralsight',
    qualtrics: 'Qualtrics',
  };
  if (map[id]) return map[id];
  if (id.startsWith('t_')) return id.replace(/^t_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (id.startsWith('st_')) return id.replace(/^st_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return id;
}

// Upskilling callout: identify the lowest-scoring dimension and project the
// overall lift if you closed it. Uses an even 0.2 weight as a client-side proxy.
function UpskillingCalcOut({ score, dim }: { score: number; dim: { skills: number; sector: number; stage: number; mission: number; network: number } }) {
  const dims = [
    { key: 'skills',  label: 'skills',  v: dim.skills },
    { key: 'sector',  label: 'sector experience',  v: dim.sector },
    { key: 'stage',   label: 'stage fit',  v: dim.stage },
    { key: 'mission', label: 'mission alignment', v: dim.mission },
    { key: 'network', label: 'network bridge', v: dim.network },
  ];
  const lowest = dims.reduce((a, b) => (a.v <= b.v ? a : b));
  if (lowest.v >= 90) return null; // already strong everywhere
  const target = 95;
  const lift = Math.round((target - lowest.v) * 0.2);
  if (lift < 2) return null;
  const projected = Math.min(99, score + lift);
  return (
    <div className="rounded-lg bg-nucleus-cream/70 border-l-4 border-l-nucleus-accent2 p-3.5 text-sm">
      <div className="text-[10px] uppercase tracking-widest text-nucleus-accent2 font-semibold">Upskilling lift</div>
      <div className="text-nucleus-ink mt-1 leading-relaxed">
        You're at <span className="font-semibold tabular-nums">{score}</span> overall.
        Closing the <span className="font-semibold">{lowest.label}</span> gap (currently {lowest.v}) projects to{' '}
        <span className="font-semibold tabular-nums">~{projected}</span> — a <span className="font-semibold">+{lift}-point</span> lift.
      </div>
    </div>
  );
}

// ----- Close the gap: actionable suggestions list -----
function CloseTheGap({ talentId, startupId, suggestions, score }: {
  talentId: string; startupId: string; suggestions: MatchSuggestion[]; score: number;
}) {
  const [open, setOpen] = useState(false);
  const [, setNudge] = useState(0); // bump to force re-render after roadmap.add
  const totalLift = useMemo(() => suggestions.reduce((sum, s) => sum + s.points, 0), [suggestions]);

  function addOne(s: MatchSuggestion) {
    roadmap.add(talentId, {
      title: s.title,
      body: s.body,
      dimension: s.dimension,
      points: s.points,
      sourceStartupId: startupId,
    });
    setNudge((n) => n + 1);
    toast(`Added "${s.title}" to your roadmap.`, 'success');
  }
  function addAll() {
    suggestions.forEach((s) => roadmap.add(talentId, {
      title: s.title, body: s.body, dimension: s.dimension, points: s.points, sourceStartupId: startupId,
    }));
    setNudge((n) => n + 1);
    toast(`Added ${suggestions.length} tasks to your roadmap.`, 'success');
  }

  return (
    <Section title="Close the gap" icon={<Target className="w-3.5 h-3.5" />}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-lg border-2 border-dashed border-nucleus-accent/40 bg-nucleus-cream/40 hover:bg-nucleus-cream hover:border-nucleus-accent transition-all p-4 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-nucleus-ink">Improve this score with {suggestions.length} concrete steps</div>
              <div className="text-xs text-nucleus-subtle mt-0.5">Specific, named actions — not generic advice. Estimated total lift: <span className="font-semibold text-nucleus-accent">+{totalLift} points</span> → ~{Math.min(99, score + totalLift)}.</div>
            </div>
            <ChevronDown className="w-4 h-4 text-nucleus-accent shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const already = roadmap.has(talentId, { title: s.title, sourceStartupId: startupId });
            return (
              <div key={i} className="rounded-lg border hairline bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-nucleus-ink">{s.title}</div>
                    <div className="text-xs text-nucleus-subtle mt-1 leading-relaxed">{s.body}</div>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-nucleus-accent2">
                    <span className="px-1.5 py-0.5 rounded bg-nucleus-accent2/10">+{s.points}</span>
                    <span>{s.dimension}</span>
                  </span>
                </div>
                <button
                  onClick={() => addOne(s)}
                  disabled={already}
                  className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all ${
                    already
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-nucleus-ink text-nucleus-cream hover:opacity-90'
                  }`}
                >
                  {already ? (<><Check className="w-3 h-3" /> In your roadmap</>) : (<><Plus className="w-3 h-3" /> Add to my roadmap</>)}
                </button>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button onClick={addAll} className="text-xs text-nucleus-accent font-semibold hover:underline">
              Add all to my roadmap
            </button>
            <button onClick={() => setOpen(false)} className="text-xs text-nucleus-subtle hover:text-nucleus-ink">
              Collapse
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ----- Draft my own intro -----
// The single submit-to-Nucleus point. The drafted email IS the intro request
// body — when an admin approves, this is what gets forwarded. "Copy" remains
// as a secondary option for users who'd rather reach out directly without
// Nucleus facilitating.
function DraftIntro({ talentId, startupId, talent, startup, draft, existing, onSubmitted }: {
  talentId: string; startupId: string;
  talent: string; startup: string; draft: string;
  existing: { id: string; status: string; message?: string } | null;
  onSubmitted: (intro: { id: string; status: string; message?: string }) => void;
}) {
  const [open, setOpen] = useState(!!existing);
  const [body, setBody] = useState(existing?.message ?? draft);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setBody(existing?.message ?? draft); }, [draft, existing?.message]);
  useEffect(() => { if (existing) setOpen(true); }, [existing?.id]);

  const submitted = !!existing;
  const statusLabel = !submitted ? '' :
    existing.status === 'introduced' ? 'Introduced' :
    existing.status === 'declined'   ? 'Declined' :
                                       'Awaiting Nucleus review';

  async function submit() {
    setSubmitting(true);
    try {
      const r = await api.createIntro(talentId, startupId, body.trim());
      onSubmitted({ id: r.id, status: r.status, message: body.trim() });
      toast('Submitted to Nucleus. They\'ll review and forward.', 'success');
    } catch (e) {
      toast(`Couldn't submit: ${(e as Error).message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      toast('Draft copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Couldn\'t copy. Select the text and copy manually.', 'error');
    }
  }

  return (
    <Section title={submitted ? 'Your intro' : 'Send an intro'} icon={<Mail className="w-3.5 h-3.5" />}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-lg border-2 border-dashed border-nucleus-accent2/40 bg-nucleus-cream/40 hover:bg-nucleus-cream hover:border-nucleus-accent2 transition-all p-4 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-nucleus-ink">Submit your draft to Nucleus</div>
              <div className="text-xs text-nucleus-subtle mt-0.5">Claude pre-drafted a personalized intro from {talent} to {startup}. Edit, then submit — Nucleus reviews and forwards.</div>
            </div>
            <ChevronDown className="w-4 h-4 text-nucleus-accent2 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </button>
      ) : (
        <div className={`rounded-lg border p-4 ${submitted ? 'bg-nucleus-cream/40 border-nucleus-accent2/40' : 'bg-white hairline'}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">
              From {talent} → {startup}
            </div>
            {submitted && (
              <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${
                existing.status === 'introduced' ? 'bg-emerald-100 text-emerald-700' :
                existing.status === 'declined'   ? 'bg-red-100 text-red-700' :
                                                   'bg-nucleus-accent2/15 text-nucleus-accent2'
              }`}>
                {statusLabel}
              </span>
            )}
          </div>
          {submitted ? (
            <div className="text-sm text-nucleus-ink leading-relaxed whitespace-pre-line bg-white border hairline rounded-lg p-3">
              {body}
            </div>
          ) : (
            <textarea
              className="w-full text-sm text-nucleus-ink leading-relaxed bg-nucleus-cream/40 border hairline rounded-lg p-3 resize-none focus:outline-none focus:border-nucleus-accent2"
              rows={Math.max(7, Math.ceil(body.length / 70))}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            {submitted ? (
              <span className="text-xs text-nucleus-subtle">
                {existing.status === 'introduced' ? 'Email forwarded by Nucleus.' :
                 existing.status === 'declined'   ? 'Nucleus declined to facilitate.' :
                                                    'Nucleus will review and forward.'}
              </span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={submit}
                    disabled={submitting || body.trim().length < 20}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-nucleus-accent text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Submit to Nucleus
                  </button>
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border hairline text-nucleus-ink hover:bg-nucleus-cream transition-colors"
                    title="Copy to send directly without Nucleus"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Or copy & send directly'}
                  </button>
                </div>
                <button onClick={() => setOpen(false)} className="text-xs text-nucleus-subtle hover:text-nucleus-ink">
                  Collapse
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
