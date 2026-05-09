import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { api, pipe, pretty, type Startup } from '@/lib/api';
import { StartupLogo } from '@/components/Avatar.tsx';
import { HeroLandscape } from '@/components/HeroLandscape.tsx';

export function Landing() {
  const [startups, setStartups] = useState<Startup[]>([]);
  useEffect(() => { api.startupList().then(setStartups); }, []);
  // Lead with the deep-tech flagships, then a couple of contrasting examples.
  const featuredOrder = ['st_neurotouch', 'st_silicell', 'st_aerolith', 'st_lumalign', 'st_palisade', 'st_provident'];
  const featured = featuredOrder
    .map((id) => startups.find((s) => s.id === id))
    .filter(Boolean) as Startup[];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-10 md:pb-14 relative">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="pill-soft">For The Nucleus Institute · Utah</span>
              <h1 className="display text-4xl md:text-5xl xl:text-6xl font-semibold mt-5 leading-[1.05]">
                Utah's deep tech runs on people <span className="text-nucleus-accent">who aren't on LinkedIn.</span>
              </h1>
              <p className="text-base md:text-lg text-nucleus-subtle mt-5">
                Browse U of U / BYU / USU spinouts. See the operators we've matched to each — and read why, in plain English.
                When one looks like you, claim the seat. Nucleus does the intro.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap items-center">
                <Link to="/story" className="btn-primary group">
                  <Play className="w-4 h-4 fill-current" /> Watch the 90s demo
                </Link>
                <Link to="/discover" className="btn-outline">
                  Or browse all 18 startups <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 text-xs text-nucleus-subtle flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nucleus-accent2" />
                Live matcher · 35 operators · 18 startups · 80 ecosystem edges
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

      {/* Browse-first: the marquee strip */}
      <section id="flagship" className="bg-nucleus-paper border-y hairline">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h2 className="display text-2xl md:text-3xl font-semibold">Six startups looking for someone right now.</h2>
              <p className="text-sm text-nucleus-subtle mt-1">Click any to see ranked candidates and how the matcher reasoned about each.</p>
            </div>
            <Link to="/discover" className="text-sm text-nucleus-accent font-medium">All 18 →</Link>
          </div>
          <div className="mt-7 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((s) => (
              <Link
                key={s.id}
                to={`/startup/${s.id}`}
                className="card p-5 hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-start gap-3">
                  <StartupLogo name={s.name} seed={s.logoSeed} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="display font-semibold text-base">{s.name}</h3>
                      <span className="pill-soft">{pretty(s.sector)}</span>
                    </div>
                    <div className="text-[11px] uppercase tracking-widest text-nucleus-subtle mt-1">
                      {pretty(s.fundingStage)} · {pretty(s.origin)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-nucleus-ink mt-3 line-clamp-3 leading-relaxed">{s.oneliner}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pipe(s.immediateNeeds).slice(0, 3).map((n) => (
                    <span key={n} className="pill-accent">need: {pretty(n)}</span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-nucleus-accent font-medium">See ranked matches →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three rehearsed scenarios — the demo bait */}
      <section className="bg-nucleus-cream">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="display text-2xl md:text-3xl font-semibold">Three matches, three stories.</h2>
          <p className="text-sm text-nucleus-subtle mt-1">A hand-picked sample of what the matcher surfaced from this dataset.</p>
          <div className="mt-7 grid md:grid-cols-3 gap-5">
            <ScenarioCard
              kicker="Executive → deep tech"
              title="Sarah Chen → NeuroTouch Bio"
              body="Ex-Recursion VP Regulatory who led two FDA Class III submissions. NeuroTouch is pre-IND with a Class III neural implant. The matcher flagged her overlap on regulatory pathway and pre-clinical ops, plus a U of U network bridge through Dr. Lee."
              href="/talent/t_sarah_chen"
            />
            <ScenarioCard
              kicker="Student → research spinout"
              title="Mira Okonjo → TerraForm Ag"
              body="BYU CS senior with two ML-in-remote-sensing papers. TerraForm builds CV-driven seeding plans for Western rangelands. Network bridge: her advisor (Dr. Hart) is a TerraForm cofounder."
              href="/talent/t_mira_okonjo"
            />
            <ScenarioCard
              kicker="Operator → scaling SaaS"
              title="Tom Brigham → Sentry SaaS"
              body="Ex-Pluralsight COO who scaled a vertical SaaS through $200M ARR. Sentry is a profitable, $2M-ARR Utah franchise-software company looking to bring in a CEO so the founder can step into chairman."
              href="/talent/t_tom_brigham"
            />
          </div>
        </div>
      </section>

      {/* What makes this different — moved AFTER browse */}
      <section className="bg-nucleus-paper border-t hairline">
        <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-5">
          <FeatureCard
            kicker="Why this exists"
            title="Tech doesn't fail in the lab"
            body="It fails at the market match. Nucleus finds the operator who's done it before — for the company that's about to do it for the first time."
          />
          <FeatureCard
            kicker="What's different"
            title="Explainable by design"
            body="Every match shows a per-dimension breakdown — skills, sector, stage, mission, network — and a one-paragraph 'why' grounded in actual profile evidence."
          />
          <FeatureCard
            kicker="How we ship"
            title="Built for your stack"
            body="Drops into the existing Squarespace contact page. Pushes intros and notes back into Affinity automatically. No data migration on day one."
          />
        </div>

        {/* Five-bucket fidelity strip + acknowledged gap */}
        <div className="max-w-6xl mx-auto px-6 pb-14 -mt-2">
          <div className="card p-5 md:p-6 bg-nucleus-cream/60 grid md:grid-cols-[1.4fr_1fr] gap-5 items-start">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">Mirrors your existing Connections Hub</div>
              <h3 className="display text-xl md:text-2xl font-semibold mt-1">Five paths · one funnel · one matcher.</h3>
              <p className="text-sm text-nucleus-subtle mt-2 leading-relaxed">
                We modeled all five buckets you already use — Operators, Mentors, Subject-Matter Experts, Angel Investors / VCs, and Service Providers. The matcher uses different weighting per bucket: investors care about stage thesis and check size; service providers about practice area and sector experience; mentors about mission alignment.
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
            <div className="border-l-2 border-l-nucleus-accent pl-4 md:pl-5">
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

      {/* Claim CTA — last */}
      <section className="bg-nucleus-cream border-t hairline">
        <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-5 items-stretch">
          <div className="card p-7 flex flex-col">
            <span className="pill-soft self-start">Talent</span>
            <h3 className="display text-2xl font-semibold mt-3">Saw a startup that fits?</h3>
            <p className="text-sm text-nucleus-subtle mt-2 flex-1">
              Paste your LinkedIn or a paragraph about yourself — we'll fill in the wizard and show your top 5 matches in seconds. Two minutes, tops.
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/join" className="btn-primary">
                <Sparkles className="w-4 h-4" /> Paste a bio
              </Link>
              <Link to="/discover" className="btn-ghost text-sm">Keep browsing</Link>
            </div>
          </div>
          <div className="card p-7 flex flex-col">
            <span className="pill-soft self-start">Founders</span>
            <h3 className="display text-2xl font-semibold mt-3">Building something hard?</h3>
            <p className="text-sm text-nucleus-subtle mt-2 flex-1">
              Drop your deck excerpt or lab page. We'll structure it, surface ranked operator candidates, and (with your OK) push the match into Affinity for the Nucleus team to facilitate.
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/join/startup" className="btn-accent">
                <Sparkles className="w-4 h-4" /> Paste a pitch
              </Link>
              <Link to="/discover" className="btn-ghost text-sm">See who else is building</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <span className="text-xs font-semibold tracking-widest uppercase text-nucleus-accent">{kicker}</span>
      <h3 className="display text-xl font-semibold mt-2">{title}</h3>
      <p className="text-sm text-nucleus-subtle mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

function ScenarioCard({ kicker, title, body, href }: { kicker: string; title: string; body: string; href: string }) {
  return (
    <Link to={href} className="card p-6 hover:shadow-lg transition-shadow group block">
      <span className="text-xs font-semibold tracking-widest uppercase text-nucleus-accent2">{kicker}</span>
      <h3 className="display text-lg font-semibold mt-2">{title}</h3>
      <p className="text-sm text-nucleus-subtle mt-2 leading-relaxed">{body}</p>
      <div className="mt-4 text-sm font-medium text-nucleus-accent group-hover:translate-x-1 transition-transform">See the match →</div>
    </Link>
  );
}
