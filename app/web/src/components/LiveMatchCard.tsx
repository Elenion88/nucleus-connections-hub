// The hero card. One real match, real names, real LLM headline. Cycles
// through three pre-cached pairs so the card stays alive without becoming
// a chart. Reads like Stripe showing a real receipt rather than an
// architecture diagram.

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api, type MatchExplain } from '@/lib/api';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';
import { ScoreDonut } from '@/components/ScoreDonut.tsx';

interface Pair { talentId: string; startupId: string }

const PAIRS: Pair[] = [
  { talentId: 't_sarah_chen',   startupId: 'st_neurotouch' },
  { talentId: 't_mira_okonjo',  startupId: 'st_terraform'  },
  { talentId: 't_tom_brigham',  startupId: 'st_sentry'     },
];

const CYCLE_MS = 9000;

export function LiveMatchCard() {
  const [idx, setIdx] = useState(0);
  const [data, setData] = useState<Record<string, MatchExplain>>({});

  // Pre-fetch all three; they're cached on the server, so it's effectively free.
  useEffect(() => {
    PAIRS.forEach((p) => {
      const key = `${p.talentId}|${p.startupId}`;
      api.explain(p.talentId, p.startupId)
        .then((r) => setData((prev) => ({ ...prev, [key]: r })))
        .catch(() => {});
    });
  }, []);

  // Cycle the focal pair
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PAIRS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const current = PAIRS[idx];
  const key = `${current.talentId}|${current.startupId}`;
  const explain = data[key];

  // Top dimensions (3 strongest) — small horizontal bars beneath the headline
  const topDims = useMemo(() => {
    if (!explain) return [];
    const dims = [
      { label: 'Skills',  value: explain.dimensions.skills },
      { label: 'Sector',  value: explain.dimensions.sector },
      { label: 'Stage',   value: explain.dimensions.stage },
      { label: 'Mission', value: explain.dimensions.mission },
      { label: 'Network', value: explain.dimensions.network },
    ].sort((a, b) => b.value - a.value);
    return dims.slice(0, 3);
  }, [explain]);

  return (
    <div className="relative">
      {/* Subtle live-pulse strip above the card */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-nucleus-subtle">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-nucleus-accent2 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-nucleus-accent2" />
          </span>
          Live · {idx + 1} of {PAIRS.length} · auto-cycles every {CYCLE_MS / 1000}s
        </span>
      </div>

      <div className="relative rounded-2xl border hairline bg-white shadow-soft overflow-hidden min-h-[460px]">
        {/* Cycle progress bar at top */}
        <motion.div
          key={`bar-${idx}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
          className="absolute top-0 left-0 right-0 h-0.5 bg-nucleus-accent/60"
        />

        <AnimatePresence mode="wait">
          {explain ? (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="p-7 md:p-9"
            >
              {/* Identity strip */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={explain.talent?.name ?? ''} seed={explain.talent?.photoSeed} size={44} />
                  <div className="min-w-0">
                    <div className="display text-base font-semibold text-nucleus-ink truncate">{explain.talent?.name}</div>
                    <div className="text-xs text-nucleus-subtle truncate">{explain.talent?.headline}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ScoreDonut score={explain.score} size={56} />
                </div>
              </div>

              {/* Match arrow */}
              <div className="my-5 flex items-center gap-3 text-nucleus-subtle text-xs uppercase tracking-widest">
                <span className="h-px flex-1 bg-nucleus-line" />
                <span>matched to</span>
                <span className="h-px flex-1 bg-nucleus-line" />
              </div>

              {/* Startup identity */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StartupLogo name={explain.startup?.name ?? ''} seed={explain.startup?.logoSeed} size={44} />
                  <div className="min-w-0">
                    <div className="display text-base font-semibold text-nucleus-ink truncate">{explain.startup?.name}</div>
                    <div className="text-xs text-nucleus-subtle truncate">{explain.startup?.oneliner}</div>
                  </div>
                </div>
              </div>

              {/* The headline — the actual LLM-written sentence, the centerpiece */}
              <div className="mt-6 border-l-2 border-l-nucleus-accent pl-4 md:pl-5">
                <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Why this match
                </div>
                <p className="display text-base md:text-lg text-nucleus-ink mt-2 leading-snug">
                  {explain.headline}
                </p>
              </div>

              {/* Three strongest dimensions */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {topDims.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-nucleus-subtle">{d.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-nucleus-ink">{d.value}</span>
                    </div>
                    <div className="h-1 bg-nucleus-line rounded overflow-hidden">
                      <motion.div
                        key={`bar-${key}-${d.label}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${d.value}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full bg-nucleus-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: deep-link */}
              <Link
                to={`/talent/${current.talentId}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-nucleus-accent font-semibold hover:gap-2 transition-all"
              >
                See the full match <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-9 flex items-center justify-center min-h-[460px] text-nucleus-subtle text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Loading the matcher…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cycle indicator dots */}
      <div className="mt-3 flex items-center gap-1.5">
        {PAIRS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to match ${i + 1}`}
            className={`h-1 rounded-full transition-all ${i === idx ? 'bg-nucleus-accent w-8' : 'bg-nucleus-line w-3 hover:bg-nucleus-subtle'}`}
          />
        ))}
      </div>
    </div>
  );
}
