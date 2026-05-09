import { useEffect, useState } from 'react';
import { api, type Talent, type Startup } from '@/lib/api';
import { Loader2, Database, Send, CheckCircle2, XCircle } from 'lucide-react';

interface Intro { id: string; talentId: string; startupId: string; status: string; message?: string; createdAt: number | string }

export function NucleusAdmin() {
  const [intros, setIntros] = useState<Intro[]>([]);
  const [aff, setAff] = useState<{ connected: boolean; mode: string } | null>(null);
  const [pushPreview, setPushPreview] = useState<unknown[] | null>(null);
  const [pushing, setPushing] = useState(false);
  const [talentMap, setTalentMap] = useState<Record<string, Talent>>({});
  const [startupMap, setStartupMap] = useState<Record<string, Startup>>({});

  async function refresh() {
    const [introsData, affData, talents, startups] = await Promise.all([
      api.intros(),
      api.affinityStatus(),
      api.talentList(),
      api.startupList(),
    ]);
    setIntros(introsData);
    setAff(affData);
    setTalentMap(Object.fromEntries(talents.map((t) => [t.id, t])));
    setStartupMap(Object.fromEntries(startups.map((s) => [s.id, s])));
  }
  useEffect(() => { refresh(); }, []);

  function fmtDate(d: number | string | undefined) {
    if (d == null) return '—';
    const date = typeof d === 'number' ? new Date(d * 1000) : new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }

  async function pushToAffinity(intro: Intro) {
    setPushing(true);
    try {
      const r = await api.affinityPushPreview(intro.talentId, intro.startupId, intro.message ?? 'Match approved by Nucleus.');
      setPushPreview(r.requests ?? r.results ?? []);
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl font-semibold">Nucleus admin</h1>
          <p className="text-nucleus-subtle text-sm mt-1">For Nick + the Nucleus team. Approve intros, sync to Affinity, manage the queue.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-widest text-nucleus-subtle">Affinity</span>
          {aff?.connected ? (
            <span className="pill-sage"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> live</span>
          ) : (
            <span className="pill-soft"><Database className="w-3 h-3 mr-1 inline" /> dry-run</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 card p-6">
          <h2 className="display text-xl font-semibold">Intro request queue</h2>
          <p className="text-xs text-nucleus-subtle mt-1">Talent or startup-initiated intro requests waiting for Nucleus to facilitate.</p>

          <div className="mt-5 divide-y hairline">
            {intros.length === 0 && <div className="py-8 text-center text-sm text-nucleus-subtle">No requests yet — request one from any match drawer.</div>}
            {intros.map((i) => {
              const t = talentMap[i.talentId];
              const s = startupMap[i.startupId];
              return (
              <div key={i.id} className="py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="font-medium text-sm">{t?.name ?? i.talentId} <span className="text-nucleus-subtle">↔</span> {s?.name ?? i.startupId}</div>
                  <div className="text-xs text-nucleus-subtle mt-0.5">{t?.headline} · needs: {s?.immediateNeeds?.split('|').slice(0, 2).join(', ')}</div>
                  {i.message && <div className="text-xs text-nucleus-subtle mt-1">"{i.message}"</div>}
                  <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle mt-1.5">
                    {fmtDate(i.createdAt)} · status: {i.status}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-outline text-xs" onClick={() => pushToAffinity(i)} disabled={pushing}>
                    {pushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    Sync to Affinity
                  </button>
                  <button className="btn-accent text-xs"><Send className="w-3 h-3" /> Approve & email</button>
                  <button className="btn-ghost text-xs text-nucleus-subtle"><XCircle className="w-3 h-3" /> Decline</button>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <h3 className="display text-lg font-semibold">Affinity sync</h3>
            <p className="text-xs text-nucleus-subtle mt-1">
              {aff?.connected
                ? 'Live mode — calls go to api.affinity.co/v2.'
                : 'Dry-run mode — set AFFINITY_API_KEY in env to enable live writes. The integration story is the same either way.'}
            </p>
            <div className="mt-4 text-xs text-nucleus-subtle space-y-1">
              <div>• Pull persons + organizations from Affinity lists</div>
              <div>• Map Affinity custom fields → Nucleus profile schema</div>
              <div>• Push approved matches as Notes on both records</div>
              <div>• Add to "Hackathon Matched" list</div>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-[10px] uppercase tracking-widest text-nucleus-accent font-semibold">Directory · admin</div>
            <h3 className="display text-lg font-semibold mt-1">Browse the index</h3>
            <p className="text-xs text-nucleus-subtle mt-1.5">Hidden from public nav. Use these to look up specific people or companies.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href="/discover?tab=startups" className="card p-3 hover:shadow-sm transition-shadow text-center">
                <div className="display text-xl font-semibold tabular-nums">18</div>
                <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">Startups</div>
              </a>
              <a href="/discover?tab=operators" className="card p-3 hover:shadow-sm transition-shadow text-center">
                <div className="display text-xl font-semibold tabular-nums">39</div>
                <div className="text-[10px] uppercase tracking-widest text-nucleus-subtle">Operators</div>
              </a>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="display text-lg font-semibold">Squarespace embed</h3>
            <p className="text-xs text-nucleus-subtle mt-1">
              Drop-in replacement for the Typeform on nucleusutah.org/contact.
            </p>
            <a href="/embed-preview" className="btn-outline mt-3 text-sm w-full justify-center">Preview embed →</a>
          </div>
        </aside>
      </div>

      {pushPreview && (
        <div className="card mt-6 p-6">
          <div className="text-xs uppercase tracking-widest text-nucleus-subtle mb-3">Affinity request {aff?.connected ? 'sent' : 'preview'}</div>
          <pre className="text-xs bg-nucleus-cream rounded-lg p-4 overflow-auto max-h-96">{JSON.stringify(pushPreview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
