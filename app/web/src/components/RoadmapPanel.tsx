// Per-talent roadmap surface. Lives in the sidebar of the talent detail page.
// Reads from localStorage; auto-refreshes when the drawer's "Add to roadmap"
// dispatches the nucleus:roadmap event.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Check, Trash2, ArrowRight } from 'lucide-react';
import { roadmap, type RoadmapTask } from '@/lib/roadmap';
import type { Startup } from '@/lib/api';

export function RoadmapPanel({ talentId, startupMap }: { talentId: string; startupMap: Record<string, Startup> }) {
  const [tasks, setTasks] = useState<RoadmapTask[]>(() => roadmap.list(talentId));

  useEffect(() => {
    const refresh = () => setTasks(roadmap.list(talentId));
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.talentId === talentId) refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === `nucleus.roadmap.${talentId}`) refresh();
    };
    window.addEventListener('nucleus:roadmap', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('nucleus:roadmap', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, [talentId]);

  if (tasks.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">
          <Target className="w-3 h-3" /> My roadmap
        </div>
        <p className="text-xs text-nucleus-subtle mt-2 leading-relaxed">
          No tasks yet. Open any match's "Why?" drawer and click <span className="font-semibold text-nucleus-ink">Close the gap</span> to add concrete actions here.
        </p>
      </div>
    );
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const totalLift = open.reduce((s, t) => s + t.points, 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-nucleus-subtle font-semibold">
          <Target className="w-3 h-3" /> My roadmap
        </div>
        <span className="text-[10px] text-nucleus-subtle">
          {open.length} open · {done.length} done
        </span>
      </div>
      {totalLift > 0 && (
        <div className="text-xs text-nucleus-ink mt-2">
          Open tasks worth <span className="font-semibold text-nucleus-accent">+{totalLift} points</span> across your matches.
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {[...open, ...done].slice(0, 6).map((t) => (
          <li key={t.id} className={`flex items-start gap-2 text-sm ${t.done ? 'opacity-50' : ''}`}>
            <button
              onClick={() => { roadmap.toggle(talentId, t.id); setTasks(roadmap.list(talentId)); }}
              className={`mt-0.5 w-4 h-4 rounded border shrink-0 grid place-items-center transition-all ${
                t.done ? 'bg-nucleus-accent2 border-nucleus-accent2 text-white' : 'border-nucleus-line hover:border-nucleus-accent2'
              }`}
              aria-label={t.done ? 'Mark undone' : 'Mark done'}
            >
              {t.done && <Check className="w-3 h-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium leading-snug ${t.done ? 'line-through' : 'text-nucleus-ink'}`}>{t.title}</div>
              <div className="text-[11px] text-nucleus-subtle mt-0.5 leading-snug">
                +{t.points} {t.dimension}
                {startupMap[t.sourceStartupId] && (
                  <>
                    {' · for '}
                    <Link to={`/startup/${t.sourceStartupId}`} className="hover:text-nucleus-accent">
                      {startupMap[t.sourceStartupId].name}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => { roadmap.remove(talentId, t.id); setTasks(roadmap.list(talentId)); }}
              className="text-nucleus-subtle hover:text-red-600 transition-colors shrink-0"
              aria-label="Remove task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </li>
        ))}
      </ul>
      {tasks.length > 6 && (
        <div className="text-[11px] text-nucleus-subtle mt-2 inline-flex items-center gap-1">
          + {tasks.length - 6} more <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}
