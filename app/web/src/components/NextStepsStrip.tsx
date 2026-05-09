// "What happens next" four-pip strip used on signup pages. Closes the trust loop
// that the live Nucleus contact page leaves open (typeform → silence).

import { Pencil, Wand2, Sparkles, Handshake } from 'lucide-react';

interface Step { Icon: typeof Pencil; label: string; sub: string }

const TALENT_STEPS: Step[] = [
  { Icon: Pencil,        label: 'Paste a paragraph',  sub: 'LinkedIn blurb, resume excerpt, anything' },
  { Icon: Wand2,         label: 'Review the wizard',  sub: 'Claude pre-fills · you edit any field' },
  { Icon: Sparkles,      label: 'See your top matches', sub: 'Live, ranked, with explanations' },
  { Icon: Handshake, label: 'Nucleus does the intro', sub: 'We push the match into Affinity for you' },
];

const STARTUP_STEPS: Step[] = [
  { Icon: Pencil,        label: 'Drop your deck excerpt', sub: 'Or a lab page, or one paragraph' },
  { Icon: Wand2,         label: 'Review the wizard',      sub: 'Claude structures it · you edit any field' },
  { Icon: Sparkles,      label: 'See ranked operators',   sub: 'Per-dimension breakdown · network bridge' },
  { Icon: Handshake, label: 'Push to Affinity',       sub: 'One click · the Nucleus team facilitates' },
];

export function NextStepsStrip({ side = 'talent' }: { side?: 'talent' | 'startup' }) {
  const steps = side === 'talent' ? TALENT_STEPS : STARTUP_STEPS;
  return (
    <div className="rounded-xl2 border hairline bg-nucleus-cream/60 px-4 py-4 md:px-5 md:py-5">
      <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold mb-3">
        What happens next
      </div>
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2">
        {steps.map((s, i) => {
          const Icon = s.Icon;
          return (
            <li key={i} className="flex items-start gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <span className="w-7 h-7 grid place-items-center rounded-full bg-white border hairline">
                  <Icon className="w-3.5 h-3.5 text-nucleus-accent" />
                </span>
                {i < steps.length - 1 && (
                  <span className="hidden md:block absolute top-1/2 -right-2 w-2 h-px bg-nucleus-line" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-nucleus-ink leading-tight">
                  <span className="text-nucleus-subtle font-normal mr-1">{i + 1}.</span>{s.label}
                </div>
                <div className="text-[11px] text-nucleus-subtle mt-0.5 leading-tight">{s.sub}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
