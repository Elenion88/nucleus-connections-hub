import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Building2, Shield, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Layout() {
  const loc = useLocation();
  const navItems = [
    { to: '/', label: 'Home',  match: (p: string) => p === '/' },
    { to: '/story', label: 'Story', match: (p: string) => p.startsWith('/story') },
  ];
  const isHome = loc.pathname === '/';
  return (
    <div className="min-h-screen flex flex-col">
      <PersonaToggle />
      <header className="bg-nucleus-paper border-b hairline sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">
          <Link to="/" className="flex items-baseline gap-0.5 group" aria-label="Nucleus home">
            <span className="display text-lg md:text-xl font-semibold tracking-tight text-nucleus-ink">Nucleus</span>
            <span className="display text-lg md:text-xl font-semibold text-nucleus-accent leading-none">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {navItems.map((n) => {
              const search = loc.pathname + loc.search;
              const active = n.to === '/' ? isHome : n.match(search);
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={cn(
                    'py-1 border-b-2 transition-colors',
                    active ? 'text-nucleus-ink border-nucleus-accent' : 'text-nucleus-subtle hover:text-nucleus-ink border-transparent',
                  )}
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="ml-auto" />
          {/* Story moved into nav · Persona toggle floats top-right */}
        </div>
      </header>
      <main key={loc.pathname} className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t hairline bg-nucleus-paper">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-nucleus-subtle flex justify-between flex-wrap gap-3">
          <span>The Nucleus Institute · Utah Innovation Connections Hub · prototype</span>
          <span className="flex items-center gap-3">
            <Link to="/nucleus" className="hover:text-nucleus-ink">Nucleus admin</Link>
            <span>· Built for AI Builder Day 2026</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

interface Persona { key: string; label: string; short: string; href: string; Icon: typeof User; match: (path: string) => boolean }
const PERSONAS: Persona[] = [
  { key: 'visitor', label: 'Visitor',        short: 'Visitor',    href: '/',                        Icon: Eye,        match: (p) => p === '/' || p === '/story' },
  { key: 'sarah',   label: 'Sarah Chen',     short: 'Sarah',      href: '/demo/talent/sarah',       Icon: User,       match: (p) => p.includes('/demo/talent/') || p.startsWith('/talent/') },
  { key: 'neuro',   label: 'NeuroTouch Bio', short: 'NeuroTouch', href: '/demo/startup/neurotouch', Icon: Building2,  match: (p) => p.includes('/demo/startup/') || p.startsWith('/startup/') },
  { key: 'admin',   label: 'Nucleus admin',  short: 'Admin',      href: '/nucleus',                 Icon: Shield,     match: (p) => p.startsWith('/nucleus') || p.startsWith('/discover') },
];

function PersonaToggle() {
  const loc = useLocation();
  const nav = useNavigate();
  const path = loc.pathname;
  const activeKey = PERSONAS.find((p) => p.match(path))?.key ?? 'visitor';

  return (
    <div className="fixed top-3 md:top-4 right-3 md:right-6 z-40">
      <div className="text-[9px] uppercase tracking-[0.18em] text-nucleus-subtle font-semibold mb-1.5 text-center">
        Demo · view as
      </div>
      <div className="inline-flex items-center bg-white border hairline rounded-full p-1 shadow-lg">
        {PERSONAS.map((p) => {
          const Icon = p.Icon;
          const isActive = p.key === activeKey;
          return (
            <button
              key={p.key}
              onClick={() => nav(p.href)}
              aria-pressed={isActive}
              title={p.label}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                isActive
                  ? 'bg-nucleus-ink text-nucleus-cream shadow-soft'
                  : 'text-nucleus-subtle hover:text-nucleus-ink hover:bg-nucleus-cream',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{p.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
