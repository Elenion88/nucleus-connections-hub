// Squarespace integration demo — frames the Nucleus AI form inside a mocked
// browser + nucleusutah.org/contact page chrome so judges immediately see
// "this drops into your existing site". Mirrors the live Connections Hub
// 5-bucket layout so the visual delta is "your taxonomy, but matched."

import { Link } from 'react-router-dom';
import {
  Lock, ChevronLeft, ChevronRight, RefreshCw, Briefcase, Heart, GraduationCap,
  DollarSign, Wrench, Sparkles, ArrowRight,
} from 'lucide-react';

const BUCKETS = [
  { key: 'operator',         label: 'Operators / Executives', Icon: Briefcase,      accent: 'bg-nucleus-accent/15 text-nucleus-accent' },
  { key: 'mentor',           label: 'Mentors',                 Icon: Heart,           accent: 'bg-rose-100 text-rose-700' },
  { key: 'sme',              label: 'Subject-Matter Experts', Icon: GraduationCap,  accent: 'bg-violet-100 text-violet-700' },
  { key: 'investor',         label: 'Angel Investors / VCs',  Icon: DollarSign,     accent: 'bg-emerald-100 text-emerald-700' },
  { key: 'service_provider', label: 'Service Providers',     Icon: Wrench,         accent: 'bg-amber-100 text-amber-700' },
];

export function EmbedPreview() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs uppercase tracking-widest text-nucleus-subtle">Squarespace integration · live preview</div>
      <h1 className="display text-3xl md:text-4xl font-semibold mt-1">As it would appear at <span className="text-nucleus-accent">nucleusutah.org/contact</span></h1>
      <p className="text-nucleus-subtle text-sm mt-2 max-w-2xl">
        One iframe, one Code Block, one Affinity-bound match flow — replacing five Typeforms that today silo submissions per bucket.
      </p>

      <div className="grid md:grid-cols-3 gap-3 mt-5">
        <DeltaCard label="Today" body="5 separate Typeforms feed Affinity. No matching, no transparency, no startup self-serve path." tone="dim" />
        <DeltaCard label="With Nucleus AI" body="Same 5 buckets, one funnel. Operators see their top 5 matches before they submit. Founders get a self-serve path." tone="bright" />
        <DeltaCard label="Integration weight" body="One Squarespace Code Block. Twelve lines of vanilla JS. Affinity push runs server-side." tone="muted" />
      </div>

      {/* Browser chrome */}
      <div className="mt-8 rounded-2xl overflow-hidden shadow-xl border hairline bg-white">
        <div className="bg-gray-100 border-b hairline px-3 py-2.5 flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </span>
          <div className="flex items-center gap-1 text-gray-400 ml-2">
            <ChevronLeft className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
          <div className="ml-2 flex-1 max-w-xl mx-auto bg-white rounded-md px-3 py-1 flex items-center gap-2 text-xs text-gray-500 border hairline">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>nucleusutah.org/contact</span>
          </div>
        </div>

        {/* Squarespace site header (mimics the actual live site) */}
        <div className="bg-white px-6 md:px-10 py-4 border-b hairline flex items-center gap-6">
          <div className="font-serif text-base md:text-lg tracking-tight text-[#1a3a64]">THE NUCLEUS INSTITUTE</div>
          <nav className="ml-auto hidden md:flex gap-5 text-xs uppercase tracking-widest text-gray-600">
            <span>About Us</span><span>Programs</span><span>Events</span>
            <span className="text-[#1a3a64] font-semibold">Contact</span>
          </nav>
        </div>

        {/* Squarespace hero block */}
        <div className="px-6 md:px-10 py-10 md:py-14 bg-white border-b hairline">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Connections Hub</div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a3a64] mt-3 italic">Connections Hub</h2>
          <p className="text-sm text-gray-600 mt-3 max-w-2xl">
            Welcome to the Nucleus Institute's contact hub. We believe in bringing together leaders, mentors, and innovators to create something extraordinary.
          </p>
        </div>

        {/* Embedded Nucleus block */}
        <div className="bg-gray-50 border-y-2 border-dashed border-nucleus-accent/40 px-6 md:px-10 py-8 md:py-10 relative">
          <span className="absolute -top-3 left-6 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-nucleus-accent text-white font-semibold inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Squarespace Code Block · Nucleus AI
          </span>

          <div className="rounded-2xl bg-nucleus-cream/70 border hairline p-5 md:p-7">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">Find your match in 60 seconds</div>
                <h3 className="display text-xl md:text-2xl font-semibold mt-1">How do you fit into Utah's deep-tech network?</h3>
              </div>
              <span className="text-[11px] text-nucleus-subtle">Pick a path · review · see your top matches before you submit</span>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-2.5">
              {BUCKETS.map((b) => {
                const Icon = b.Icon;
                return (
                  <Link
                    key={b.key}
                    to={`/join/talent?bucket=${b.key}`}
                    className="card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-2 text-left"
                  >
                    <span className={`w-8 h-8 grid place-items-center rounded-md ${b.accent}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold text-nucleus-ink leading-tight">{b.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5">
              <Link to="/join/startup" className="card p-3 hover:shadow-md transition-all flex items-center gap-3">
                <span className="w-8 h-8 rounded-md grid place-items-center bg-nucleus-ink/10 text-nucleus-ink">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-nucleus-ink leading-tight flex-1">Founders / Startups · self-serve path (new)</span>
                <ArrowRight className="w-4 h-4 text-nucleus-accent" />
              </Link>
            </div>
          </div>
        </div>

        {/* Squarespace footer */}
        <div className="bg-white px-6 md:px-10 py-6 text-[11px] text-gray-400 flex items-center justify-between flex-wrap gap-2">
          <span>© The Nucleus Institute · Utah</span>
          <span>Squarespace site · Nucleus AI Code Block embedded · demo wrap</span>
        </div>
      </div>

      {/* Snippet */}
      <div className="card mt-8 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-nucleus-subtle">The Code Block snippet</div>
            <div className="text-sm text-nucleus-ink mt-1">Paste once into <code className="text-xs bg-nucleus-paper px-1.5 py-0.5 rounded">/contact</code>. No build, no plugin, no Affinity API touched on the client.</div>
          </div>
          <span className="pill-soft text-[11px]">12 lines · vanilla JS · postMessage to Squarespace analytics</span>
        </div>
        <pre className="mt-3 text-xs bg-nucleus-ink text-nucleus-cream rounded-lg p-4 overflow-auto leading-relaxed">{`<!-- paste in a Squarespace Code Block on /contact -->
<div id="nucleus-form" style="min-height:520px"></div>
<script>
(function () {
  var f = document.createElement('iframe');
  f.src = 'https://nucleus.kokomo.quest/embed';
  f.style.cssText = 'width:100%;border:0;height:520px;background:#f7f3ec;border-radius:16px';
  document.getElementById('nucleus-form').appendChild(f);
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://nucleus.kokomo.quest') return;
    if (e.data && e.data.kind === 'nucleus:submit' && window.gtag) {
      gtag('event', 'nucleus_submit', { profile_id: e.data.id, bucket: e.data.bucket });
    }
  });
})();
</script>`}</pre>
      </div>
    </div>
  );
}

function DeltaCard({ label, body, tone }: { label: string; body: string; tone: 'dim' | 'bright' | 'muted' }) {
  const cls =
    tone === 'bright' ? 'bg-nucleus-cream border-l-4 border-l-nucleus-accent' :
    tone === 'dim'    ? 'bg-white border-l-4 border-l-nucleus-line' :
                        'bg-white border-l-4 border-l-nucleus-accent2';
  return (
    <div className={`card p-4 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest font-semibold text-nucleus-subtle">{label}</div>
      <div className="text-sm text-nucleus-ink mt-1.5 leading-relaxed">{body}</div>
    </div>
  );
}
