import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Eye, User, Building2, Shield } from 'lucide-react';
import { api, pipe, pretty, type Startup } from '@/lib/api';
import { StartupLogo } from '@/components/Avatar.tsx';
import { HeroLandscape } from '@/components/HeroLandscape.tsx';

interface Persona {
  key: string;
  href: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  Icon: typeof Eye;
  accent: string;
  iconWrap: string;
}

const PERSONAS: Persona[] = [
  {
    key: 'visitor',
    href: '/story',
    kicker: 'Visitor',
    title: 'Watch the story',
    body: 'A 70-second auto-play tour of how the matcher reasons about the Sarah ↔ NeuroTouch match.',
    cta: 'Watch the demo',
    Icon: Eye,
    accent: 'border-nucleus-line/60 hover:border-nucleus-ink/40',
    iconWrap: 'bg-nucleus-ink/5 text-nucleus-ink',
  },
  {
    key: 'sarah',
    href: '/demo/talent/sarah',
    kicker: 'Operator',
    title: 'View as Sarah Chen',
    body: 'Watch an ex-Recursion VP fill in her bio — see the wizard extract, the matches rank, and the landscape paint in.',
    cta: 'View as Sarah',
    Icon: User,
    accent: 'border-nucleus-accent/40 hover:border-nucleus-accent',
    iconWrap: 'bg-nucleus-accent/15 text-nucleus-accent',
  },
  {
    key: 'neuro',
    href: '/demo/startup/neurotouch',
    kicker: 'Founder',
    title: 'View as NeuroTouch',
    body: 'Drop a one-paragraph pitch. See ranked operator candidates, per-dimension fit, and a one-click Affinity push.',
    cta: 'View as NeuroTouch',
    Icon: Building2,
    accent: 'border-nucleus-accent2/40 hover:border-nucleus-accent2',
    iconWrap: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'admin',
    href: '/nucleus',
    kicker: 'Nucleus admin',
    title: 'View as Nick',
    body: 'The intro queue, every operator and startup at a glance, and the one-click push back into Affinity.',
    cta: 'Open admin',
    Icon: Shield,
    accent: 'border-nucleus-line/60 hover:border-nucleus-ink/40',
    iconWrap: 'bg-violet-100 text-violet-700',
  },
];

export function Landing() {
  const [startups, setStartups] = useState<Startup[]>([]);
  useEffect(() => { api.startupList().then(setStartups); }, []);
  const featuredOrder = ['st_neurotouch', 'st_silicell', 'st_aerolith', 'st_lumalign', 'st_palisade', 'st_provident'];
  const featured = featuredOrder
    .map((id) => startups.find((s) => s.id === id))
    .filter(Boolean) as Startup[];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-8 md:pb-12 relative">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="pill-soft">For The Nucleus Institute · Utah</span>
              <h1 className="display text-4xl md:text-5xl xl:text-6xl font-semibold mt-5 leading-[1.05]">
                Utah's deep tech runs on people <span className="text-nucleus-accent">who aren't on LinkedIn.</span>
              </h1>
              <p className="text-base md:text-lg text-nucleus-subtle mt-5">
                A live AI matcher for U of U / BYU / USU spinouts and the operators, mentors, advisors, investors, and service providers who can move them. Pick a path below — every demo is interactive.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap items-center">
                <Link to="/story" className="btn-primary group">
                  <Play className="w-4 h-4 fill-current" /> Watch the 70s story
                </Link>
                <a href="#paths" className="btn-outline">
                  Or pick a path <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-6 text-xs text-nucleus-subtle flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nucleus-accent2" />
                Live matcher · 39 operators · 18 startups · five Connections-Hub buckets · Affinity-bound
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <HeroLandscape />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Persona-card row — the primary nav */}
      <section id="paths" className="bg-nucleus-paper border-y hairline">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-14">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h2 className="display text-2xl md:text-3xl font-semibold">Pick a path. Watch the system from that seat.</h2>
              <p className="text-sm text-nucleus-subtle mt-1.5">Each card is a guided demo · skippable at any point · ~10 seconds each.</p>
            </div>
            <span className="text-[11px] text-nucleus-subtle uppercase tracking-widest">Tip: also in the upper-right corner</span>
          </div>
          <div className="mt-7 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PERSONAS.map((p, i) => (
              <PersonaCard key={p.key} p={p} delay={0.05 + i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* Slim startup marquee — keeps the "real Utah companies" texture */}
      <section className="bg-nucleus-cream border-b hairline">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-14">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">A few of the startups in the index</div>
              <h2 className="display text-xl md:text-2xl font-semibold mt-1">Real Utah deep-tech, hand-curated.</h2>
            </div>
            <Link to="/nucleus" className="text-xs text-nucleus-subtle hover:text-nucleus-ink">See all 18 (admin) →</Link>
          </div>
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((s) => (
              <Link
                key={s.id}
                to={`/startup/${s.id}`}
                className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-3"
              >
                <StartupLogo name={s.name} seed={s.logoSeed} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="display font-semibold text-sm">{s.name}</h3>
                    <span className="pill-soft text-[10px]">{pretty(s.sector)}</span>
                  </div>
                  <p className="text-xs text-nucleus-subtle mt-1 line-clamp-2 leading-relaxed">{s.oneliner}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pipe(s.immediateNeeds).slice(0, 3).map((n) => (
                      <span key={n} className="pill-accent text-[10px]">need: {pretty(n)}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Five-bucket fidelity strip + acknowledged gap */}
      <section className="bg-nucleus-paper border-b hairline">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 items-start">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">Mirrors your existing Connections Hub</div>
              <h3 className="display text-xl md:text-2xl font-semibold mt-1">Five paths · one funnel · one matcher.</h3>
              <p className="text-sm text-nucleus-subtle mt-2 leading-relaxed">
                We modeled all five buckets you already use — Operators, Mentors, Subject-Matter Experts, Angel Investors / VCs, and Service Providers. Different weighting per bucket: investors care about stage thesis and check size; service providers about practice area; mentors about mission alignment.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="pill-soft">Operators</span>
                <span className="pill-soft">Mentors</span>
                <span className="pill-soft">SMEs / Advisors</span>
                <span className="pill-soft">Investors</span>
                <span className="pill-soft">Service Providers</span>
                <span className="pill-accent">+ Founders (new)</span>
              </div>
            </div>
            <div className="border-l-2 border-l-nucleus-accent pl-5">
              <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">The gap we close</div>
              <p className="text-sm text-nucleus-ink mt-1.5 leading-relaxed">
                Today, Nucleus enters startups into Affinity by hand. We added a 60-second startup-side wizard so founders self-serve and the matcher runs the moment the profile lands.
              </p>
              <Link to="/embed-preview" className="mt-3 inline-flex items-center gap-1.5 text-sm text-nucleus-accent font-medium">
                See the Squarespace embed <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PersonaCard({ p, delay }: { p: Persona; delay: number }) {
  const Icon = p.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        to={p.href}
        className={`card p-5 h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 ${p.accent} group`}
      >
        <div className="flex items-center justify-between">
          <span className={`w-10 h-10 rounded-lg grid place-items-center ${p.iconWrap}`}>
            <Icon className="w-5 h-5" />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">{p.kicker}</span>
        </div>
        <h3 className="display font-semibold text-base md:text-lg mt-3 leading-snug">{p.title}</h3>
        <p className="text-sm text-nucleus-subtle mt-2 leading-relaxed flex-1">{p.body}</p>
        <div className="mt-4 text-sm text-nucleus-accent font-medium inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
          {p.cta} <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}
