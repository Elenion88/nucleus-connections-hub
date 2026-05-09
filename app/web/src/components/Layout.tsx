import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Play, ChevronDown, User, Building2, Shield, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Layout() {
  const loc = useLocation();
  const navItems = [
    { to: '/', label: 'Home',     match: (p: string) => p === '/' },
    { to: '/network', label: 'Network', match: (p: string) => p.startsWith('/network') },
  ];
  const isHome = loc.pathname === '/';
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-nucleus-paper border-b hairline sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">
          <Link to="/" className="flex items-center gap-2 md:gap-2.5 group">
            <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-nucleus-ink relative grid place-items-center">
              <span className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-nucleus-accent" />
            </span>
            <span className="display text-base md:text-lg font-semibold">Nucleus</span>
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
          <div className="ml-auto flex items-center gap-2">
            {!isHome && (
              <Link
                to="/story"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-nucleus-ink text-nucleus-cream hover:opacity-90 transition-opacity"
              >
                <Play className="w-3 h-3 fill-current" /> Story
              </Link>
            )}
            <PersonaMenu />
          </div>
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

interface Persona { key: string; label: string; sub: string; href: string; Icon: typeof User }
const PERSONAS: Persona[] = [
  { key: 'visitor', label: 'Visitor',         sub: 'Landing · overview',           href: '/',                         Icon: Eye },
  { key: 'sarah',   label: 'Sarah Chen',      sub: 'Operator · ex-Recursion VP',   href: '/demo/talent/sarah',        Icon: User },
  { key: 'neuro',   label: 'NeuroTouch Bio',  sub: 'Founder · neural implant',     href: '/demo/startup/neurotouch',  Icon: Building2 },
  { key: 'admin',   label: 'Nucleus admin',   sub: 'Nick · curator view',          href: '/nucleus',                  Icon: Shield },
];

function PersonaMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('visitor');
  const ref = useRef<HTMLDivElement | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = PERSONAS.find((p) => p.key === active) ?? PERSONAS[0];
  const CurrentIcon = current.Icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border hairline bg-white hover:border-nucleus-accent/40 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CurrentIcon className="w-3.5 h-3.5 text-nucleus-subtle" />
        <span className="hidden sm:inline text-nucleus-ink font-medium">{current.label}</span>
        <ChevronDown className="w-3 h-3 text-nucleus-subtle" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 rounded-xl2 border hairline bg-white shadow-xl py-1.5 z-40">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-nucleus-subtle border-b hairline">View as…</div>
          {PERSONAS.map((p) => {
            const Icon = p.Icon;
            const isActive = p.key === active;
            return (
              <button
                key={p.key}
                role="menuitem"
                onClick={() => { setActive(p.key); setOpen(false); nav(p.href); }}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-nucleus-cream transition-colors',
                  isActive && 'bg-nucleus-cream/60',
                )}
              >
                <Icon className="w-4 h-4 mt-0.5 text-nucleus-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-nucleus-ink">{p.label}</div>
                  <div className="text-xs text-nucleus-subtle">{p.sub}</div>
                </div>
              </button>
            );
          })}
          <div className="px-3 py-2 text-[10px] text-nucleus-subtle border-t hairline">Demo only · no auth</div>
        </div>
      )}
    </div>
  );
}
