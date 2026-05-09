// Mirrors the live Nucleus Connections Hub structure: five named buckets that map
// to the existing Typeform funnels at nucleusutah.org/contact. Each card deep-links
// into the appropriate signup flow with bucket-aware copy. The startups card also
// addresses the gap on the live site (no startup-side application).

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Briefcase, Heart, GraduationCap, DollarSign, Wrench, Building2, Sparkles,
} from 'lucide-react';

interface Bucket {
  key: string;
  href: string;
  kicker: string;
  title: string;
  body: string;
  examples: string[];
  Icon: typeof Briefcase;
  accent: string;        // tailwind classes for the icon chip
}

const BUCKETS: Bucket[] = [
  {
    key: 'operator',
    href: '/join/talent?bucket=operator',
    kicker: 'Operators / Executives',
    title: 'Lead an early-stage Utah deep-tech company.',
    body: 'CEO, COO, CTO, CMO, fractional, or technical IC — looking for full-time or fractional seats at companies that need someone who has done it before.',
    examples: ['Ex-Recursion VP', 'Ex-Pluralsight COO', 'Sarcos program manager'],
    Icon: Briefcase,
    accent: 'bg-nucleus-accent/15 text-nucleus-accent',
  },
  {
    key: 'mentor',
    href: '/join/talent?bucket=mentor',
    kicker: 'Mentors',
    title: 'Help founders for free.',
    body: 'You\'ve been there before and you want to give time. Match to founders whose problems you have actually solved, on the schedule you set.',
    examples: ['Two exits behind you', '20 yrs in your domain', 'Pro-bono coaching'],
    Icon: Heart,
    accent: 'bg-rose-100 text-rose-700',
  },
  {
    key: 'sme',
    href: '/join/talent?bucket=sme',
    kicker: 'Subject-Matter Experts',
    title: 'Advise for equity.',
    body: 'Domain depth in life sciences, AI, defense, energy, advanced manufacturing, cyber, fintech, or software. Take an advisory shareholder seat where your expertise is rate-limiting.',
    examples: ['Huntsman PI', 'AFWERX program officer', 'BYU regenerative-ag'],
    Icon: GraduationCap,
    accent: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'investor',
    href: '/join/talent?bucket=investor',
    kicker: 'Angel Investors / VCs',
    title: 'See the deals before they hit your inbox.',
    body: 'Match on stage thesis, sector thesis, and check size. Surface Utah-rooted companies that fit your fund\'s mandate before they go on the road.',
    examples: ['Solo GP', 'Wasatch-focused fund', 'Angel collective'],
    Icon: DollarSign,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'service_provider',
    href: '/join/talent?bucket=service_provider',
    kicker: 'Service Providers',
    title: 'Be visible to the founders who need you.',
    body: 'Legal, creative, technical, operational. Match to startups whose stage and sector you actually serve — and the matcher tells founders why you, specifically.',
    examples: ['FDA reg counsel', 'Brand & narrative', 'Fractional CFO firm'],
    Icon: Wrench,
    accent: 'bg-amber-100 text-amber-700',
  },
];

const FOUNDER_BUCKET: Bucket = {
  key: 'startup',
  href: '/join/startup',
  kicker: 'Founders / Startups',
  title: 'Tell us what you\'re building.',
  body: 'Today, Nucleus enters startups by hand. Drop your deck excerpt, lab page, or one paragraph — we structure it, surface ranked operator candidates, and (with your OK) push the match into Affinity.',
  examples: ['U of U / BYU / USU spinout', 'Pre-seed → Series A', 'Looking for CEO, regulatory, biz dev'],
  Icon: Building2,
  accent: 'bg-nucleus-ink/10 text-nucleus-ink',
};

export function JoinChooser() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="pill-soft inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Connections hub · five paths</span>
        <h1 className="display text-3xl md:text-5xl font-semibold mt-4 leading-tight max-w-3xl">
          How do you fit into Utah's deep-tech network?
        </h1>
        <p className="text-base text-nucleus-subtle mt-3 max-w-2xl">
          Pick the path that matches you. Each takes about two minutes — paste a paragraph, review, and you'll see your top matches before you submit.
        </p>
      </motion.div>

      {/* Five talent-side buckets */}
      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUCKETS.map((b, i) => (
          <BucketCard key={b.key} bucket={b} delay={0.05 + i * 0.05} />
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-[2fr_1fr] gap-4 items-stretch">
        <BucketCard bucket={FOUNDER_BUCKET} delay={0.45} variant="wide" />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="card p-6 bg-nucleus-cream"
        >
          <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">Why five paths</div>
          <p className="text-sm text-nucleus-ink mt-2 leading-relaxed">
            We mirror Nucleus's existing Connections Hub buckets exactly — but with one funnel, one matcher, and one dashboard for Nick instead of five Typeforms feeding silos in Affinity.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function BucketCard({ bucket, delay, variant = 'default' }: { bucket: Bucket; delay: number; variant?: 'default' | 'wide' }) {
  const Icon = bucket.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full"
    >
      <Link
        to={bucket.href}
        className="card p-5 md:p-6 h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all group"
      >
        <div className="flex items-start gap-3">
          <span className={`shrink-0 w-10 h-10 rounded-lg grid place-items-center ${bucket.accent}`}>
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">{bucket.kicker}</div>
            <h3 className={`display font-semibold mt-1 leading-snug ${variant === 'wide' ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>
              {bucket.title}
            </h3>
          </div>
        </div>
        <p className="text-sm text-nucleus-subtle mt-3 leading-relaxed flex-1">{bucket.body}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {bucket.examples.map((e) => (
            <span key={e} className="pill-soft text-[11px]">{e}</span>
          ))}
        </div>
        <div className="mt-4 text-sm text-nucleus-accent font-medium inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
          Start <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}
