import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, pipe, pretty, type Talent, type Startup } from '@/lib/api';
import { Avatar, StartupLogo } from '@/components/Avatar.tsx';

type Tab = 'operators' | 'startups';

export function Discover() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = useMemo(() => {
    const t = params.get('tab');
    return t === 'operators' || t === 'talent' ? 'operators' : 'startups';
  }, [params]);
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };
  const [q, setQ] = useState('');
  const [talents, setTalents] = useState<Talent[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);

  useEffect(() => {
    api.talentList().then(setTalents);
    api.startupList().then(setStartups);
  }, []);

  const filteredTalents = talents.filter((t) =>
    !q || (t.name + t.headline + t.skills + t.sectors).toLowerCase().includes(q.toLowerCase())
  );
  const filteredStartups = startups.filter((s) =>
    !q || (s.name + s.oneliner + s.sector + s.immediateNeeds).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="display text-3xl font-semibold">Discover</h1>
          <p className="text-nucleus-subtle text-sm mt-1">Browse the Utah ecosystem. Pick anyone — every profile has live matches.</p>
        </div>
        <div className="flex bg-nucleus-paper border hairline rounded-lg p-1 text-sm">
          <button
            className={`px-4 py-1.5 rounded-md ${tab === 'startups' ? 'bg-nucleus-ink text-nucleus-cream' : 'text-nucleus-subtle hover:text-nucleus-ink'}`}
            onClick={() => setTab('startups')}
          >
            Startups · {startups.length}
          </button>
          <button
            className={`px-4 py-1.5 rounded-md ${tab === 'operators' ? 'bg-nucleus-ink text-nucleus-cream' : 'text-nucleus-subtle hover:text-nucleus-ink'}`}
            onClick={() => setTab('operators')}
          >
            Operators · {talents.length}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          className="input max-w-md"
          placeholder={tab === 'startups' ? 'Search by name, sector, or need…' : 'Search by name, skill, or sector…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {tab === 'startups' ? (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {filteredStartups.map((s) => (
            <Link key={s.id} to={`/startup/${s.id}`} className="card p-5 hover:shadow-lg transition-shadow flex gap-4">
              <StartupLogo name={s.name} seed={s.logoSeed} size={56} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="display font-semibold text-lg">{s.name}</h3>
                  <span className="pill-soft">{pretty(s.sector)}</span>
                  <span className="pill-soft">{pretty(s.fundingStage)}</span>
                </div>
                <p className="text-sm text-nucleus-subtle mt-1 line-clamp-2">{s.oneliner}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pipe(s.immediateNeeds).slice(0, 4).map((n) => (
                    <span key={n} className="pill-accent">need: {pretty(n)}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {filteredTalents.map((t) => (
            <Link key={t.id} to={`/talent/${t.id}`} className="card p-5 hover:shadow-lg transition-shadow flex gap-4">
              <Avatar name={t.name} seed={t.photoSeed} size={56} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="display font-semibold text-lg">{t.name}</h3>
                  <span className="pill-soft">{pretty(t.roleType)}</span>
                  <span className="pill-soft">{pretty(t.availability)}</span>
                </div>
                <p className="text-sm text-nucleus-subtle mt-1 line-clamp-2">{t.headline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pipe(t.sectors).slice(0, 3).map((s) => (
                    <span key={s} className="pill-sage">{pretty(s)}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
