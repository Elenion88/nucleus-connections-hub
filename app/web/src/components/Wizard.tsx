// Generic wizard shell — left rail with steps, header progress, prev/next footer.

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
}

export function Wizard({
  steps,
  current,
  onNext,
  onPrev,
  onSubmit,
  canNext,
  submitting,
  children,
}: {
  steps: Step[];
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  canNext: boolean;
  submitting?: boolean;
  children: React.ReactNode;
}) {
  const isLast = current === steps.length - 1;
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Mobile: compact horizontal step strip */}
      <div className="md:hidden mb-5 card p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {steps.map((s, i) => {
            const status = i < current ? 'done' : i === current ? 'current' : 'todo';
            return (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                  status === 'done' ? 'bg-nucleus-accent text-white' :
                  status === 'current' ? 'bg-nucleus-ink text-nucleus-cream' :
                  'bg-white border hairline text-nucleus-subtle'
                }`}>
                  {status === 'done' ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </div>
                <span className={`text-xs ${status === 'todo' ? 'text-nucleus-subtle' : 'text-nucleus-ink font-medium'}`}>{s.title}</span>
                {i < steps.length - 1 && <span className="text-nucleus-line">·</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-10">
        <aside className="hidden md:block space-y-1">
          {steps.map((s, i) => {
            const status = i < current ? 'done' : i === current ? 'current' : 'todo';
            return (
              <div key={s.id} className="flex items-start gap-3 py-2">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  status === 'done' ? 'bg-nucleus-accent text-white' :
                  status === 'current' ? 'bg-nucleus-ink text-nucleus-cream' :
                  'bg-white border hairline text-nucleus-subtle'
                }`}>
                  {status === 'done' ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <div>
                  <div className={`text-sm font-medium ${status === 'todo' ? 'text-nucleus-subtle' : 'text-nucleus-ink'}`}>{s.title}</div>
                  {s.subtitle && <div className="text-xs text-nucleus-subtle">{s.subtitle}</div>}
                </div>
              </div>
            );
          })}
        </aside>

        <section>
          <div className="card p-5 md:p-8 min-h-[380px] md:min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button onClick={onPrev} disabled={current === 0} className="btn-ghost disabled:opacity-40">
              ← Back
            </button>
            <div className="text-xs text-nucleus-subtle">Step {current + 1} of {steps.length}</div>
            {!isLast ? (
              <button onClick={onNext} disabled={!canNext} className="btn-primary">Continue →</button>
            ) : (
              <button onClick={onSubmit} disabled={!canNext || submitting} className="btn-accent">
                {submitting ? 'Saving…' : 'Submit & see matches →'}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function MultiSelect({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { value: string; label: string; helper?: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  cols?: number;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-2`}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
              on ? 'border-nucleus-accent bg-nucleus-accent/5' : 'border-nucleus-line bg-white hover:border-nucleus-subtle/40'
            }`}
          >
            <div className="font-medium text-sm">{o.label}</div>
            {o.helper && <div className="text-xs text-nucleus-subtle mt-0.5">{o.helper}</div>}
          </button>
        );
      })}
    </div>
  );
}

export function Choice({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; helper?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
              on ? 'border-nucleus-accent bg-nucleus-accent/5' : 'border-nucleus-line bg-white hover:border-nucleus-subtle/40'
            }`}
          >
            <div className="font-medium text-sm">{o.label}</div>
            {o.helper && <div className="text-xs text-nucleus-subtle mt-0.5">{o.helper}</div>}
          </button>
        );
      })}
    </div>
  );
}
