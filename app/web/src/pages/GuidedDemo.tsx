// Guided demo flow that walks a judge through the signup-to-match journey from
// a single persona's perspective. Pre-cached, deterministic, ~12 seconds with a
// skip-pill that jumps straight to the detail page.
//
// Routes:
//   /demo/talent/sarah        → Sarah Chen filling in her info
//   /demo/startup/neurotouch  → NeuroTouch Bio dropping their pitch
//
// "Functional bones, cached substance" — the wizard chrome is the real Wizard
// component; the data is hardcoded; no API calls happen during the demo. After
// the script finishes we navigate to the existing detail page where the real
// match landscape is already painted with live data.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Loader2, FastForward, Briefcase, Building2, ArrowRight, Check,
} from 'lucide-react';
import { Wizard, type Step } from '@/components/Wizard.tsx';
import { NextStepsStrip } from '@/components/NextStepsStrip.tsx';

interface DemoScript {
  side: 'talent' | 'startup';
  bucketLabel: string;
  bucketAccent: string;
  finalRoute: string;
  bio: string;
  fields: { label: string; value: string }[];
  pills: { skills: string[]; sectors: string[]; mission: string[] };
  fitShape: { availability: string; comp: string; risk: string };
  steps: Step[];
}

const SARAH_SCRIPT: DemoScript = {
  side: 'talent',
  bucketLabel: 'Operators / Executives',
  bucketAccent: 'bg-nucleus-accent/15 text-nucleus-accent',
  finalRoute: '/talent/t_sarah_chen',
  bio: "Spent 9 years at Recursion taking imaging-AI-derived therapeutics through pre-clin and into early clinical. Personally led two FDA Class III device submissions and one IND. Looking for an early-stage life-sciences CEO seat where the regulatory path is the rate-limiting step.",
  fields: [
    { label: 'Name',     value: 'Sarah Chen' },
    { label: 'Headline', value: 'Ex-Recursion VP Regulatory · led 2 FDA Class III submissions' },
    { label: 'Location', value: 'Salt Lake City, UT' },
    { label: 'Years experience', value: '14' },
  ],
  pills: {
    skills: ['FDA Class III', 'IND filings', 'regulatory strategy', 'pre-clinical operations', 'team building', 'fundraising'],
    sectors: ['Life Sciences'],
    mission: ['patient outcomes', 'deep science'],
  },
  fitShape: { availability: 'Full-time', comp: 'salary + equity', risk: 'high' },
  steps: [
    { id: 'paste', title: 'Quick start',  subtitle: 'Paste a bio' },
    { id: 'who',   title: 'Who you are',  subtitle: 'Identity + headline' },
    { id: 'expertise', title: 'Expertise', subtitle: 'Skills, sectors, role' },
    { id: 'fit',   title: 'Fit shape',    subtitle: 'Availability + comp + risk' },
    { id: 'mission', title: 'Mission',    subtitle: 'What you care about' },
  ],
};

const NEUROTOUCH_SCRIPT: DemoScript = {
  side: 'startup',
  bucketLabel: 'Founders / Startups',
  bucketAccent: 'bg-nucleus-ink/10 text-nucleus-ink',
  finalRoute: '/startup/st_neurotouch',
  bio: "NeuroTouch Bio is an implantable neural interface that lets prosthetics feel touch and texture. Spun out of a University of Utah lab. Pre-IND, with two pre-clinical pilots underway at Intermountain. Looking for a CEO with FDA Class III experience, plus regulatory and biz-dev support to navigate the Breakthrough Device pathway.",
  fields: [
    { label: 'Name',          value: 'NeuroTouch Bio' },
    { label: 'One-liner',     value: 'Implantable neural interface that lets prosthetics feel touch and texture.' },
    { label: 'Origin',        value: 'University of Utah lab' },
    { label: 'Stage',         value: 'Pre-seed · TRL 4' },
  ],
  pills: {
    skills: ['CEO', 'Regulatory', 'Biz dev', 'Advisor'],
    sectors: ['Life Sciences'],
    mission: ['patient outcomes', 'deep science'],
  },
  fitShape: { availability: 'Pre-IND · Breakthrough Device track', comp: 'salary + equity', risk: '—' },
  steps: [
    { id: 'paste',     title: 'Quick start', subtitle: 'Paste a pitch' },
    { id: 'identity',  title: 'Identity',    subtitle: 'Name + one-liner' },
    { id: 'tech',      title: 'Tech & origin', subtitle: 'Sector, TRL, stage' },
    { id: 'needs',     title: 'Needs',       subtitle: 'Roles + funding' },
  ],
};

// Phase timings (ms); skip-pill jumps to "navigate" instantly.
const TIMING = {
  typeStart:    300,
  typeCharMs:    14,    // 14ms/char ≈ 70 char/sec
  extractAt:    -1,     // computed = type completion + 350
  extractDur:   1200,
  step1At:     -1,
  step2At:     -1,
  step3At:     -1,
  step4At:     -1,
  submitAt:    -1,
  navigateAt:  -1,
};

export function GuidedDemo() {
  const params = useParams();
  const nav = useNavigate();
  const { script, key } = useMemo(() => resolve(params.who, params.side), [params.who, params.side]);
  if (!script) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center text-nucleus-subtle">
        Demo not found. <Link to="/" className="underline">Back home</Link>.
      </div>
    );
  }
  return <GuidedDemoInner key={key} script={script} nav={nav} />;
}

function GuidedDemoInner({ script, nav }: { script: DemoScript; nav: ReturnType<typeof useNavigate> }) {
  const [phase, setPhase] = useState<'typing' | 'extracting' | 'step1' | 'step2' | 'step3' | 'step4' | 'submitting' | 'done'>('typing');
  const [typedChars, setTypedChars] = useState(0);
  const [step, setStep] = useState(0);
  const cancelled = useRef(false);
  const timersRef = useRef<number[]>([]);

  const Icon = script.side === 'talent' ? Briefcase : Building2;

  // Build the schedule once.
  const schedule = useMemo(() => buildSchedule(script.bio.length, script.steps.length), [script]);

  useEffect(() => {
    cancelled.current = false;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    // 1. Type the bio progressively
    let typed = 0;
    const typeTick = () => {
      if (cancelled.current) return;
      typed = Math.min(typed + 1, script.bio.length);
      setTypedChars(typed);
      if (typed < script.bio.length) {
        timersRef.current.push(window.setTimeout(typeTick, TIMING.typeCharMs));
      }
    };
    timersRef.current.push(window.setTimeout(typeTick, TIMING.typeStart));

    // 2. Extract phase
    timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) setPhase('extracting'); }, schedule.extractAt));
    timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) { setPhase('step1'); setStep(1); } }, schedule.step1At));
    timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) { setPhase('step2'); setStep(2); } }, schedule.step2At));
    timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) { setPhase('step3'); setStep(3); } }, schedule.step3At));
    if (script.steps.length > 4) {
      timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) { setPhase('step4'); setStep(4); } }, schedule.step4At));
    }
    timersRef.current.push(window.setTimeout(() => { if (!cancelled.current) setPhase('submitting'); }, schedule.submitAt));
    timersRef.current.push(window.setTimeout(() => {
      if (!cancelled.current) {
        setPhase('done');
        nav(script.finalRoute);
      }
    }, schedule.navigateAt));

    return () => {
      cancelled.current = true;
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [script, schedule, nav]);

  function skipToResults() {
    cancelled.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    nav(script.finalRoute);
  }

  const typedSlice = script.bio.slice(0, typedChars);
  const typeDone = typedChars >= script.bio.length;

  return (
    <>
      {/* Bucket banner + skip pill */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${script.bucketAccent}`}>
            <Icon className="w-3.5 h-3.5" />
            {script.bucketLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-nucleus-ink text-nucleus-cream">
            <span className="w-1.5 h-1.5 rounded-full bg-nucleus-accent animate-pulse" /> Guided demo
          </span>
          <span className="text-xs text-nucleus-subtle hidden md:inline">
            Watch the signup → match flow. {script.steps.length}-step wizard, ~10s.
          </span>
          <button
            onClick={skipToResults}
            className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border hairline bg-white hover:border-nucleus-accent hover:text-nucleus-accent transition-colors"
          >
            <FastForward className="w-3 h-3" /> Skip to results
          </button>
        </div>
        <div className="mt-4">
          <NextStepsStrip side={script.side} />
        </div>
      </div>

      <Wizard
        steps={script.steps}
        current={step}
        onNext={() => {/* scripted */}}
        onPrev={() => {/* scripted */}}
        onSubmit={() => {/* scripted */}}
        canNext={false}
        submitting={phase === 'submitting'}
      >
        {phase === 'typing' || phase === 'extracting' ? (
          <PasteScene
            bio={typedSlice}
            done={typeDone}
            extracting={phase === 'extracting'}
            placeholder={script.bio}
            side={script.side}
          />
        ) : phase === 'step1' ? (
          <FieldsScene title={script.side === 'talent' ? 'Who you are.' : 'Identity.'} fields={script.fields.slice(0, 2)} />
        ) : phase === 'step2' ? (
          <ExpertiseScene script={script} />
        ) : phase === 'step3' ? (
          <FitShapeScene script={script} />
        ) : phase === 'step4' ? (
          <MissionScene script={script} />
        ) : (
          <SubmittingScene side={script.side} />
        )}
      </Wizard>
    </>
  );
}

// ----------------- Scenes -----------------

function PasteScene({ bio, done, extracting, placeholder, side }: { bio: string; done: boolean; extracting: boolean; placeholder: string; side: 'talent' | 'startup' }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="display text-2xl font-semibold">
          {side === 'talent' ? 'Skip the form. Paste your bio.' : 'Skip the form. Paste your pitch.'}
        </h2>
        <p className="text-sm text-nucleus-subtle mt-1">
          Drop in {side === 'talent' ? 'a LinkedIn summary, resume excerpt, or a paragraph about yourself' : 'your deck excerpt, a lab page, or a paragraph about what you\'re building'}. Claude fills in the rest.
        </p>
      </div>
      <div className="relative">
        <textarea
          className="input"
          rows={9}
          value={bio}
          readOnly
          placeholder={placeholder}
        />
        {!done && bio.length > 0 && (
          <span
            className="absolute bottom-2 right-3 inline-block w-0.5 h-5 bg-nucleus-accent animate-pulse"
            aria-hidden
          />
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className={`btn-accent transition-all ${extracting ? 'shadow-lg ring-2 ring-nucleus-accent/40' : ''}`}
          disabled
        >
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {extracting ? 'Extracting…' : 'Extract & continue'}
        </button>
        <span className="text-xs text-nucleus-subtle">
          {extracting ? 'Claude is structuring the paste into form fields…' : done ? 'Ready to extract' : 'Typing…'}
        </span>
      </div>
    </div>
  );
}

function FieldsScene({ title, fields }: { title: string; fields: { label: string; value: string }[] }) {
  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
          <Check className="w-3 h-3" /> Extracted from your bio
        </div>
        <h2 className="display text-2xl font-semibold mt-1">{title}</h2>
        <p className="text-sm text-nucleus-subtle mt-1">Review every field — we never store anything until you click Submit.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map((f) => (
          <FieldChip key={f.label} {...f} />
        ))}
      </div>
    </motion.div>
  );
}

function FieldChip({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border hairline bg-nucleus-cream/50 px-3 py-2.5"
    >
      <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">{label}</div>
      <div className="text-sm text-nucleus-ink mt-0.5 font-medium">{value}</div>
    </motion.div>
  );
}

function ExpertiseScene({ script }: { script: DemoScript }) {
  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
          <Check className="w-3 h-3" /> Expertise extracted
        </div>
        <h2 className="display text-2xl font-semibold mt-1">{script.side === 'talent' ? 'Your expertise.' : 'Tech & origin.'}</h2>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mb-2">Sectors</div>
        <div className="flex flex-wrap gap-1.5">
          {script.pills.sectors.map((s, i) => (
            <PillIn key={s} delay={i * 0.05}><span className="pill-soft">{s}</span></PillIn>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mb-2">{script.side === 'talent' ? 'Skills' : 'Immediate needs'}</div>
        <div className="flex flex-wrap gap-1.5">
          {script.pills.skills.map((s, i) => (
            <PillIn key={s} delay={0.1 + i * 0.04}><span className="pill-accent">{s}</span></PillIn>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FitShapeScene({ script }: { script: DemoScript }) {
  return (
    <motion.div className="space-y-5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
          <Check className="w-3 h-3" /> Fit shape inferred
        </div>
        <h2 className="display text-2xl font-semibold mt-1">{script.side === 'talent' ? 'Fit shape.' : 'Needs.'}</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <FieldChip label="Availability" value={script.fitShape.availability} />
        <FieldChip label="Comp shape"   value={script.fitShape.comp} />
        <FieldChip label="Risk tolerance" value={script.fitShape.risk} />
      </div>
    </motion.div>
  );
}

function MissionScene({ script }: { script: DemoScript }) {
  return (
    <motion.div className="space-y-5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold inline-flex items-center gap-1.5">
          <Check className="w-3 h-3" /> Mission inferred
        </div>
        <h2 className="display text-2xl font-semibold mt-1">Mission.</h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {script.pills.mission.map((m) => (
          <span key={m} className="pill-sage">{m}</span>
        ))}
      </div>
    </motion.div>
  );
}

function SubmittingScene({ side }: { side: 'talent' | 'startup' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-2 border-nucleus-accent border-t-transparent"
      />
      <div className="text-center">
        <div className="display text-xl font-semibold">Computing your matches…</div>
        <div className="text-sm text-nucleus-subtle mt-1">
          {side === 'talent'
            ? 'Embedding your profile · ranking 18 startups · explaining the top 5'
            : 'Embedding your pitch · ranking 39 operators · explaining the top 5'}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-nucleus-subtle">
        <ArrowRight className="w-3 h-3" /> The match landscape is loading
      </div>
    </div>
  );
}

function PillIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.25 }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

// ----------------- Helpers -----------------

function resolve(who: string | undefined, side: string | undefined): { script: DemoScript | null; key: string } {
  if (side === 'talent' && who === 'sarah') return { script: SARAH_SCRIPT, key: 'sarah' };
  if (side === 'startup' && who === 'neurotouch') return { script: NEUROTOUCH_SCRIPT, key: 'neurotouch' };
  return { script: null, key: 'none' };
}

function buildSchedule(bioLen: number, stepCount: number) {
  const typeDoneAt = TIMING.typeStart + bioLen * TIMING.typeCharMs;
  const extractAt = typeDoneAt + 350;
  const step1At   = extractAt + TIMING.extractDur;
  const step2At   = step1At + 1500;
  const step3At   = step2At + 1500;
  const step4At   = step3At + 1500;
  const lastStepAt = stepCount > 4 ? step4At : step3At;
  const submitAt  = lastStepAt + 1300;
  const navigateAt = submitAt + 1800;
  return { extractAt, step1At, step2At, step3At, step4At, submitAt, navigateAt };
}
