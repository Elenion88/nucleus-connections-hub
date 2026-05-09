import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { api, pipe, pretty, type Startup } from '@/lib/api';
import { LiveMatchCard } from '@/components/LiveMatchCard.tsx';

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
        <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-12 md:pb-20 relative">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="text-xs text-nucleus-subtle">For The Nucleus Institute · Utah</div>
              <h1 className="display text-4xl md:text-5xl xl:text-6xl font-semibold mt-5 leading-[1.05]">
                Utah's deep tech doesn't fail in the lab. <span className="text-nucleus-accent">It fails at the market match.</span>
              </h1>
              <p className="text-base md:text-lg text-nucleus-subtle mt-5 leading-relaxed">
                AI matching that shows its work — built for U of U / BYU / USU spinouts and the people who can move them: founders, executives, advisors, mentors, investors, and service providers.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap items-center">
                <Link to="/story" className="btn-primary">
                  <Play className="w-4 h-4 fill-current" /> Watch the 70s story
                </Link>
                <Link to="/demo/talent/sarah" className="btn-outline">
                  Step inside as Sarah <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-7 text-xs text-nucleus-subtle">
                39 candidates · 18 startups · five Connections-Hub buckets · Affinity-bound
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <LiveMatchCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works — editorial prose, no chrome */}
      <section className="bg-nucleus-paper border-y hairline">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
          <h2 className="display text-2xl md:text-3xl font-semibold">How it works.</h2>
          <div className="mt-7 space-y-7 text-base md:text-lg leading-relaxed text-nucleus-ink">
            <p>
              <span className="text-nucleus-subtle">Today,</span> a candidate submits a Typeform on the Nucleus contact page — whether they're a fractional executive, a free-time mentor, an advisor, an investor, or a service provider. It lands in Affinity. Nucleus reviews. Maybe an intro happens, weeks later. Startups are added by hand. There's no matching pass at all.
            </p>
            <p>
              <span className="text-nucleus-ink font-semibold">With Nucleus AI,</span> both sides paste a paragraph. Profiles populate in seconds. A candidate sees their top five startups <em>before they submit</em>, with a per-dimension breakdown — skills, sector, stage, mission, network — and a one-paragraph plain-English explanation grounded in the actual Utah ecosystem. A founder sees ranked candidates the moment they hit save.
            </p>
            <p>
              Approved matches push back into Affinity automatically — same CRM, same workflow, no data migration. The Nucleus team approves, the matcher does the triage.
            </p>
          </div>
          <div className="mt-9 flex gap-3 flex-wrap">
            <Link to="/demo/startup/neurotouch" className="text-sm font-semibold text-nucleus-accent hover:underline">
              See it from a founder's seat →
            </Link>
            <span className="text-nucleus-line">·</span>
            <Link to="/embed-preview" className="text-sm font-semibold text-nucleus-accent hover:underline">
              See the Squarespace embed →
            </Link>
            <span className="text-nucleus-line">·</span>
            <Link to="/nucleus" className="text-sm font-semibold text-nucleus-accent hover:underline">
              See the admin queue →
            </Link>
          </div>
        </div>
      </section>

      {/* Startups — typographic list, no big cards */}
      <section className="bg-nucleus-cream">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-20">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <h2 className="display text-2xl md:text-3xl font-semibold">A few of the startups in the index.</h2>
              <p className="text-sm text-nucleus-subtle mt-1.5">Hand-curated U of U / BYU / USU spinouts. Click any to see ranked matches.</p>
            </div>
            <Link to="/nucleus" className="text-xs text-nucleus-subtle hover:text-nucleus-ink">All 18 (admin) →</Link>
          </div>
          <ul className="mt-7 divide-y hairline">
            {featured.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/startup/${s.id}`}
                  className="group flex items-baseline justify-between gap-6 py-4 hover:bg-nucleus-paper/50 -mx-3 px-3 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="display font-semibold text-base md:text-lg text-nucleus-ink">{s.name}</span>
                      <span className="text-xs text-nucleus-subtle">{pretty(s.sector)} · {pretty(s.fundingStage)}</span>
                    </div>
                    <p className="text-sm text-nucleus-subtle mt-0.5 line-clamp-1 leading-snug">{s.oneliner}</p>
                  </div>
                  <div className="text-xs text-nucleus-subtle hidden md:block whitespace-nowrap">
                    Needs <span className="text-nucleus-ink">{pipe(s.immediateNeeds).slice(0, 2).map(pretty).join(' · ')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-nucleus-subtle group-hover:text-nucleus-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
