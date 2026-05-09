// Tiny self-contained toast system. No external state libs — just a global subscribe pattern.

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: string; kind: Kind; message: string }

const listeners = new Set<(t: Toast) => void>();

export function toast(message: string, kind: Kind = 'info') {
  const t = { id: Math.random().toString(36).slice(2), kind, message };
  for (const l of listeners) l(t);
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const onAdd = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.add(onAdd);
    return () => { listeners.delete(onAdd); };
  }, []);
  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto card p-3 pl-4 flex items-start gap-2.5 text-sm shadow-lg border-l-4 ${
            t.kind === 'success' ? 'border-l-nucleus-accent2' :
            t.kind === 'error' ? 'border-l-red-500' :
            'border-l-nucleus-accent'
          }`}
          role="status"
        >
          <div className="mt-0.5">
            {t.kind === 'success' && <CheckCircle2 className="w-4 h-4 text-nucleus-accent2" />}
            {t.kind === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
            {t.kind === 'info' && <Info className="w-4 h-4 text-nucleus-accent" />}
          </div>
          <div className="flex-1">{t.message}</div>
          <button
            className="text-nucleus-subtle hover:text-nucleus-ink"
            onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
