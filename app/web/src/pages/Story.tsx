// Auto-play Story Mode: 90-second guided demo of the Sarah Chen → NeuroTouch match.
// Scenes auto-advance with a progress bar. Spacebar pauses, arrows seek, Esc exits.

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Pause, Play, X, Sparkles, Send, Database, User, Building2, Sparkle } from 'lucide-react';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';
import { RadarFit } from '@/components/RadarFit.tsx';
import { ScoreDonut } from '@/components/ScoreDonut.tsx';

interface Scene { id: string; durationMs: number; render: () => React.ReactNode }

const SARAH = {
  name: 'Sarah Chen',
  headline: 'Ex-Recursion VP Regulatory · led 2 FDA Class III submissions',
  skills: ['FDA Class III', 'IND filings', 'Pre-clinical ops', 'Regulatory strategy', 'Team building', 'Fundraising'],
  affiliations: ['Recursion', 'University of Utah'],
};

const NEUROTOUCH = {
  name: 'NeuroTouch Bio',
  oneliner: 'Implantable neural interface that lets prosthetics feel touch and texture.',
  needs: ['CEO', 'Regulatory', 'Biz dev', 'Advisor'],
  origin: 'University of Utah lab',
};

const RADAR = [
  { label: 'Skills', value: 96 },
  { label: 'Sector', value: 100 },
  { label: 'Stage', value: 100 },
  { label: 'Mission', value: 100 },
  { label: 'Network', value: 80 },
];

const HERO_SENTENCE = "Sarah's two FDA Class III submissions at Recursion are exactly the regulatory bench NeuroTouch needs to clear its 18-month Breakthrough Device pathway.";

const REASONS = [
  'She spent nine years navigating imaging-AI therapeutics through pre-clinical and early clinical — NeuroTouch is at that identical inflection point.',
  'Her IND filing experience translates directly to the neural interface\'s human-subject protocols, and she explicitly wants a CEO seat where regulatory is rate-limiting.',
  'Both share U of U roots and patient-outcomes mission; Sarah knows the hospital system where NeuroTouch is already running its pre-clinical work.',
];

export function Story() {
  const nav = useNavigate();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 within current scene
  const startRef = useRef<number>(performance.now());

  const scenes: Scene[] = [
    { id: 'title', durationMs: 5000, render: TitleScene },
    { id: 'startup', durationMs: 9000, render: StartupScene },
    { id: 'talent', durationMs: 9000, render: TalentScene },
    { id: 'matcher', durationMs: 10500, render: MatcherScene },
    { id: 'why', durationMs: 14500, render: () => WhyScene({ progress }) },
    { id: 'sync', durationMs: 9000, render: SyncScene },
    { id: 'close', durationMs: 12000, render: CloseScene },
  ];

  const totalScenes = scenes.length;
  const goPrev = useCallback(() => { setSceneIdx((i) => Math.max(0, i - 1)); startRef.current = performance.now(); }, []);
  const goNext = useCallback(() => { setSceneIdx((i) => Math.min(totalScenes - 1, i + 1)); startRef.current = performance.now(); }, [totalScenes]);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') nav('/');
      else if (e.key === 'ArrowRight' || e.key === ' ' && false) goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); togglePause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, nav, togglePause]);

  // Animation loop: tick progress, auto-advance scene
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        const elapsed = now - startRef.current;
        const dur = scenes[sceneIdx].durationMs;
        if (elapsed >= dur) {
          if (sceneIdx < totalScenes - 1) {
            setSceneIdx((i) => i + 1);
            startRef.current = now;
            setProgress(0);
          } else {
            setProgress(1);
          }
        } else {
          setProgress(elapsed / dur);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sceneIdx, paused, scenes, totalScenes]);

  // Reset progress when scene changes
  useEffect(() => { setProgress(0); startRef.current = performance.now(); }, [sceneIdx]);

  const Scene = scenes[sceneIdx].render;

  return (
    <div className="fixed inset-0 z-50 bg-nucleus-ink flex flex-col">
      {/* Top bar: progress + controls */}
      <div className="px-6 md:px-10 py-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-1.5">
          {scenes.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/15 rounded overflow-hidden">
              <div
                className="h-full bg-nucleus-accent transition-all"
                style={{
                  width: i < sceneIdx ? '100%' : i === sceneIdx ? `${progress * 100}%` : '0%',
                  transitionDuration: i === sceneIdx ? '120ms' : '0ms',
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={goPrev} className="text-white/70 hover:text-white p-1" title="Prev (←)">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={togglePause} className="text-white/70 hover:text-white p-1" title="Pause/play (space)">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button onClick={goNext} className="text-white/70 hover:text-white p-1" title="Next (→)">
          <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => nav('/')} className="text-white/70 hover:text-white p-1 ml-2" title="Exit (Esc)">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scene */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={scenes[sceneIdx].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12 py-6 overflow-auto"
          >
            <Scene />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="px-6 md:px-10 py-3 text-center text-[11px] uppercase tracking-widest text-white/40">
        Scene {sceneIdx + 1} of {totalScenes} · ← → to seek · space to pause · esc to exit
      </div>
    </div>
  );
}

// --------------------------- Scenes ---------------------------

function TitleScene() {
  return (
    <div className="text-center max-w-3xl">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-nucleus-accent mb-8"
      >
        <span className="w-8 h-8 rounded-full bg-nucleus-cream" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="display text-4xl md:text-6xl font-semibold text-nucleus-cream leading-tight">
          Utah deep tech finds its operators
          <span className="block text-nucleus-accent mt-2">in 30 seconds.</span>
        </div>
        <p className="text-base md:text-lg text-white/60 mt-6 max-w-2xl mx-auto">
          A 90-second walkthrough of how Nucleus matches a U of U neural-prosthetic spinout to its regulatory CEO.
        </p>
      </motion.div>
    </div>
  );
}

function StartupScene() {
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        className="text-[11px] uppercase tracking-widest text-nucleus-accent mb-3">
        Step 1 · The startup
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-7 shadow-soft">
        <div className="flex items-center gap-4">
          <StartupLogo name={NEUROTOUCH.name} seed="story-neurotouch" size={64} />
          <div>
            <div className="display text-2xl md:text-3xl font-semibold">{NEUROTOUCH.name}</div>
            <div className="text-sm text-nucleus-subtle mt-1">{NEUROTOUCH.origin} · Seed · TRL 5</div>
          </div>
        </div>
        <p className="text-base md:text-lg mt-5 leading-relaxed">{NEUROTOUCH.oneliner}</p>
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-nucleus-subtle mb-3">Immediate needs</div>
          <div className="flex flex-wrap gap-2">
            {NEUROTOUCH.needs.map((n, i) => (
              <motion.span
                key={n}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.4, type: 'spring', stiffness: 280, damping: 22 }}
                className="pill-accent text-sm"
              >
                {n}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TalentScene() {
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-[11px] uppercase tracking-widest text-nucleus-accent2 mb-3">
        Step 2 · The operator
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-7 shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar name={SARAH.name} seed="story-sarah" size={64} />
          <div>
            <div className="display text-2xl md:text-3xl font-semibold">{SARAH.name}</div>
            <div className="text-sm text-nucleus-subtle mt-1">{SARAH.headline}</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-nucleus-subtle mb-3">Skills</div>
          <div className="flex flex-wrap gap-2">
            {SARAH.skills.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.25, type: 'spring', stiffness: 280, damping: 22 }}
                className="pill-sage text-sm"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-widest text-nucleus-subtle mb-2">Utah affiliations</div>
          <div className="flex flex-wrap gap-2">
            {SARAH.affiliations.map((a) => (
              <span key={a} className="pill-soft text-sm">{a}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MatcherScene() {
  return (
    <div className="max-w-5xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-[11px] uppercase tracking-widest text-nucleus-accent mb-3 text-center">
        Step 3 · What the matcher sees
      </motion.div>
      <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-5 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <Avatar name={SARAH.name} seed="story-sarah" size={40} />
            <div>
              <div className="font-semibold">{SARAH.name}</div>
              <div className="text-xs text-nucleus-subtle">Operator</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          className="text-4xl md:text-5xl text-nucleus-accent display"
        >
          ↔
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-5 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <StartupLogo name={NEUROTOUCH.name} seed="story-neurotouch" size={40} />
            <div>
              <div className="font-semibold">{NEUROTOUCH.name}</div>
              <div className="text-xs text-nucleus-subtle">Startup</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="mt-10 bg-nucleus-cream text-nucleus-ink rounded-xl2 p-6 shadow-soft mx-auto max-w-2xl"
      >
        <div className="text-[11px] uppercase tracking-widest text-nucleus-subtle mb-2 text-center">
          Per-dimension fit
        </div>
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <RadarFit data={RADAR} size={240} />
          <div className="space-y-2 hidden md:block">
            {RADAR.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.2 + i * 0.2 }}
                className="flex items-center justify-between gap-6 text-sm"
              >
                <span className="text-nucleus-subtle">{r.label}</span>
                <span className="font-semibold tabular-nums">{r.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
          className="text-center mt-4 text-2xl display font-semibold"
        >
          Match: <span className="text-nucleus-accent">96</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

function WhyScene({ progress }: { progress: number }) {
  // Type out the hero sentence over the first ~30% of scene (faster than before)
  const charCount = Math.min(HERO_SENTENCE.length, Math.floor(progress * HERO_SENTENCE.length * 3.3));
  const typed = HERO_SENTENCE.slice(0, charCount);
  const reasonsStartT = 0.36; // reasons fade in earlier so judge has dwell time
  return (
    <div className="max-w-3xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-[11px] uppercase tracking-widest text-nucleus-accent mb-3 flex items-center gap-2">
        <Sparkles className="w-3 h-3" />
        Step 4 · Why this match
      </motion.div>
      <div className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-7 shadow-soft border-l-4 border-l-nucleus-accent">
        <div className="display text-xl md:text-2xl font-medium leading-snug min-h-[6rem]">
          {typed}
          {charCount < HERO_SENTENCE.length && <span className="inline-block w-0.5 h-5 bg-nucleus-accent align-middle ml-1 animate-pulse" />}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {REASONS.map((r, i) => {
          const showAt = reasonsStartT + i * 0.13;
          const visible = progress > showAt;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -12 }}
              transition={{ duration: 0.4 }}
              className="bg-nucleus-cream text-nucleus-ink rounded-lg p-4 shadow-soft flex gap-3 text-sm md:text-base"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-nucleus-accent shrink-0" />
              <span>{r}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SyncScene() {
  return (
    <div className="max-w-3xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-[11px] uppercase tracking-widest text-nucleus-accent mb-3">
        Step 5 · Hand-off to Nucleus
      </motion.div>
      <div className="bg-nucleus-cream text-nucleus-ink rounded-xl2 p-7 shadow-soft">
        <div className="text-base md:text-lg leading-relaxed">
          Nick approves the match. We push it back into Affinity automatically — no manual data entry, no forwarded emails.
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center gap-3 flex-wrap"
        >
          <div className="bg-nucleus-cream rounded-lg p-3 px-4 flex items-center gap-2 text-sm">
            <Send className="w-4 h-4 text-nucleus-accent2" />
            Match approved
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 1 }} style={{ transformOrigin: 'left' }}
            className="h-px flex-1 bg-nucleus-accent" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}
            className="bg-nucleus-cream rounded-lg p-3 px-4 flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-nucleus-accent" />
            Affinity Note posted
          </motion.div>
        </motion.div>
        <motion.pre
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.6 }}
          className="mt-5 text-[11px] bg-nucleus-ink text-nucleus-cream rounded-lg p-4 leading-relaxed overflow-auto"
        >{`POST https://api.affinity.co/notes
{
  "content": "Nucleus AI match: Sarah Chen ↔ NeuroTouch Bio …",
  "person_ids":   [12783],   // resolved from sarah.chen@…
  "organization_ids": [44291] // resolved from "NeuroTouch Bio"
}`}</motion.pre>
      </div>
    </div>
  );
}

function CloseScene() {
  const ctas = [
    { to: '/talent/t_sarah_chen', kicker: 'See the live match', title: "Sarah's full profile",   sub: 'Per-dimension breakdown · network bridge · talking points', Icon: User },
    { to: '/discover?tab=startups', kicker: 'Try a different angle', title: 'Browse all 18 startups', sub: 'Every startup has live matches you can audit',                Icon: Building2 },
    { to: '/join/talent',          kicker: 'Make it personal',     title: 'Try it with your bio', sub: 'Paste a paragraph · Claude structures it · matches in seconds',  Icon: Sparkle },
  ];
  return (
    <div className="max-w-4xl w-full text-center">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="inline-block">
        <ScoreDonut score={96} size={110} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <div className="display text-2xl md:text-4xl font-semibold text-nucleus-cream mt-6 leading-tight">
          Manual triage → <span className="text-nucleus-accent">explainable, auditable matching</span>
          <span className="block text-xl md:text-2xl text-white/60 mt-2 font-normal">Now your turn.</span>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.7 } } }}
        className="mt-8 grid md:grid-cols-3 gap-3"
      >
        {ctas.map((c) => {
          const Icon = c.Icon;
          return (
            <motion.div
              key={c.to}
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.45 }}
            >
              <Link
                to={c.to}
                className="group block text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-nucleus-accent/60 rounded-xl2 p-5 h-full transition-all"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-nucleus-accent">
                  <Icon className="w-3.5 h-3.5" />
                  {c.kicker}
                </div>
                <div className="display text-lg md:text-xl font-semibold text-nucleus-cream mt-2">{c.title}</div>
                <div className="text-xs md:text-sm text-white/55 mt-1.5 leading-relaxed">{c.sub}</div>
                <div className="mt-3 text-xs text-nucleus-accent font-medium inline-flex items-center gap-1">
                  Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-6 text-[11px] text-white/40 uppercase tracking-widest"
      >
        Or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">esc</kbd> to exit
      </motion.div>
    </div>
  );
}
