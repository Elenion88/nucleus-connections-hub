import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wizard, MultiSelect, Choice, type Step } from '@/components/Wizard.tsx';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast.tsx';
import { Sparkles, Loader2, Building2 } from 'lucide-react';
import { NextStepsStrip } from '@/components/NextStepsStrip.tsx';

const steps: Step[] = [
  { id: 'paste', title: 'Quick start', subtitle: 'Paste a pitch or fill manually' },
  { id: 'about', title: 'About', subtitle: 'Name + pitch' },
  { id: 'tech', title: 'Tech & stage', subtitle: 'Sector, TRL, funding' },
  { id: 'needs', title: 'Immediate needs', subtitle: "What you're hiring" },
];

export function StartupSignup() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const [name, setName] = useState('');
  const [oneliner, setOneliner] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const [sector, setSector] = useState('life_sciences');
  const [origin, setOrigin] = useState('u_of_u_lab');
  const [trl, setTrl] = useState(4);
  const [fundingStage, setFundingStage] = useState('pre_seed');
  const [fundingRaisedUsd, setFundingRaisedUsd] = useState(0);
  const [fundingSources, setFundingSources] = useState<string[]>([]);

  const [immediateNeeds, setImmediateNeeds] = useState<string[]>([]);
  const [missionTags, setMissionTags] = useState<string[]>([]);
  const [utahRoots, setUtahRoots] = useState<string[]>([]);

  async function runExtraction() {
    if (!pasteText.trim()) return;
    setExtracting(true);
    try {
      const r = await api.extractStartup(pasteText);
      if (r.name) setName(r.name);
      if (r.oneliner) setOneliner(r.oneliner);
      if (r.description) setDescription(r.description);
      if (r.location) setLocation(r.location);
      if (r.website) setWebsite(r.website);
      if (r.sector) setSector(r.sector);
      if (r.origin) setOrigin(r.origin);
      if (r.trl) setTrl(r.trl);
      if (r.fundingStage) setFundingStage(r.fundingStage);
      if (r.fundingRaisedUsd) setFundingRaisedUsd(r.fundingRaisedUsd);
      if (r.fundingSources.length) setFundingSources(r.fundingSources);
      if (r.immediateNeeds.length) setImmediateNeeds(r.immediateNeeds);
      if (r.missionTags.length) setMissionTags(r.missionTags);
      if (r.utahRoots.length) setUtahRoots(r.utahRoots);
      toast(`Extracted ${r.immediateNeeds.length} needs, ${r.missionTags.length} mission tags. Review and adjust.`, 'success');
      setStep(1);
    } catch (e) {
      toast(`Extraction failed: ${(e as Error).message}`, 'error');
    } finally {
      setExtracting(false);
    }
  }

  const canNext =
    step === 0 ? true :
    step === 1 ? name.trim() && oneliner.trim() :
    step === 2 ? !!sector && !!origin && !!fundingStage :
    immediateNeeds.length > 0;

  async function submit() {
    setSubmitting(true);
    try {
      const r = await api.createStartup({
        name, oneliner, description,
        website: website || undefined, location: location || undefined,
        sector, origin, trl, fundingStage, fundingRaisedUsd,
        fundingSources, immediateNeeds, missionTags, utahRoots,
      });
      toast('Profile created. Computing matches…', 'success');
      nav(`/startup/${r.id}`);
    } catch (e) {
      toast(`Couldn't save: ${(e as Error).message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-nucleus-ink/10 text-nucleus-ink">
            <Building2 className="w-3.5 h-3.5" />
            Founders / Startups
          </span>
          <span className="text-xs text-nucleus-subtle">Today, Nucleus enters startups by hand. We added the missing self-serve path.</span>
          <a href="/join" className="ml-auto text-xs text-nucleus-subtle hover:text-nucleus-ink underline">Switch path</a>
        </div>
        <div className="mt-4">
          <NextStepsStrip side="startup" />
        </div>
      </div>
    <Wizard
      steps={steps}
      current={step}
      onNext={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
      onPrev={() => setStep((s) => Math.max(s - 1, 0))}
      onSubmit={submit}
      canNext={!!canNext}
      submitting={submitting}
    >
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">Skip the form. Paste your pitch.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">Drop in your deck excerpt, lab page, or a paragraph about the company. We'll fill in the rest — you'll review every field.</p>
          </div>
          <textarea
            className="input"
            rows={9}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="e.g. NeuroTouch Bio — spun out of the U of U bioengineering lab — builds an implantable neural interface that lets prosthetics feel touch. Pre-clinical with 3 patients. Need a CEO with FDA Class III experience and a regulatory advisor before our IND filing…"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="btn-accent"
              onClick={runExtraction}
              disabled={extracting || !pasteText.trim()}
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {extracting ? 'Extracting…' : 'Extract & continue'}
            </button>
            <button type="button" className="btn-ghost text-nucleus-subtle text-sm" onClick={() => setStep(1)}>
              or fill in manually →
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">Tell us about your company.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">Be specific — generic pitches lead to generic matches.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="NeuroTouch Bio" />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://neurotouch.bio" />
            </div>
            <div className="md:col-span-2">
              <label className="label">One-liner</label>
              <input className="input" value={oneliner} onChange={(e) => setOneliner(e.target.value)} placeholder="Implantable neural interface that lets prosthetics feel touch." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Origin, current state, near-term milestones, what kind of person you need." />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Salt Lake City, UT" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">Tech & funding.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">Used as both ranking signal and hard filter.</p>
          </div>
          <div>
            <label className="label">Primary sector</label>
            <Choice
              value={sector}
              onChange={setSector}
              options={[
                { value: 'life_sciences', label: 'Life Sciences' },
                { value: 'ai', label: 'AI' },
                { value: 'defense', label: 'Defense / Aerospace' },
                { value: 'cyber', label: 'Cyber' },
                { value: 'energy', label: 'Energy' },
                { value: 'advanced_manufacturing', label: 'Advanced Mfg' },
                { value: 'fintech', label: 'Fintech' },
                { value: 'software', label: 'Software' },
              ]}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Origin</label>
              <select className="input" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                <option value="u_of_u_lab">U of U lab</option>
                <option value="byu_lab">BYU lab</option>
                <option value="usu_lab">USU lab</option>
                <option value="bootstrapped">Bootstrapped</option>
                <option value="corporate_spinout">Corporate spinout</option>
              </select>
            </div>
            <div>
              <label className="label">Funding stage</label>
              <select className="input" value={fundingStage} onChange={(e) => setFundingStage(e.target.value)}>
                <option value="idea">Idea</option>
                <option value="pre_seed">Pre-seed</option>
                <option value="seed">Seed</option>
                <option value="series_a">Series A</option>
                <option value="series_b">Series B</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <div>
              <label className="label">TRL (1–9)</label>
              <input type="number" className="input" value={trl} onChange={(e) => setTrl(Number(e.target.value))} min={1} max={9} />
            </div>
            <div>
              <label className="label">Capital raised (USD)</label>
              <input type="number" className="input" value={fundingRaisedUsd} onChange={(e) => setFundingRaisedUsd(Number(e.target.value))} min={0} step={50_000} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Funding sources</label>
              <MultiSelect
                value={fundingSources}
                onChange={setFundingSources}
                options={[
                  { value: 'nih', label: 'NIH' },
                  { value: 'nsf_sbir', label: 'NSF / SBIR' },
                  { value: 'venture', label: 'Venture' },
                  { value: 'angel', label: 'Angel' },
                  { value: 'grant', label: 'Other grant' },
                ]}
                cols={3}
              />
            </div>
          </div>
          <div>
            <label className="label">Utah roots</label>
            <MultiSelect
              value={utahRoots}
              onChange={setUtahRoots}
              options={[
                { value: 'u_of_u', label: 'University of Utah' },
                { value: 'byu', label: 'BYU' },
                { value: 'usu', label: 'Utah State' },
                { value: 'silicon_slopes', label: 'Silicon Slopes' },
                { value: 'park_city', label: 'Park City' },
              ]}
              cols={3}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">Who you need.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">The matcher will weight talent who can fill these specifically.</p>
          </div>
          <div>
            <label className="label">Immediate needs</label>
            <MultiSelect
              value={immediateNeeds}
              onChange={setImmediateNeeds}
              options={[
                { value: 'ceo', label: 'CEO' },
                { value: 'cto', label: 'CTO' },
                { value: 'coo', label: 'COO' },
                { value: 'cfo', label: 'CFO' },
                { value: 'cmo', label: 'CMO' },
                { value: 'regulatory', label: 'Regulatory' },
                { value: 'biz_dev', label: 'Biz dev' },
                { value: 'sales', label: 'Sales' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'engineer', label: 'Engineer' },
                { value: 'advisor', label: 'Advisor' },
              ]}
              cols={3}
            />
          </div>
          <div>
            <label className="label">Mission tags</label>
            <MultiSelect
              value={missionTags}
              onChange={setMissionTags}
              options={[
                { value: 'patient_outcomes', label: 'Patient outcomes' },
                { value: 'deep_science', label: 'Deep science' },
                { value: 'hard_tech', label: 'Hard tech' },
                { value: 'sustainability', label: 'Sustainability' },
                { value: 'defense', label: 'Defense' },
                { value: 'productivity', label: 'Productivity' },
              ]}
              cols={2}
            />
          </div>
          <div className="card bg-nucleus-cream/60 p-4 text-sm">
            <span className="font-medium">Almost there.</span> Your profile is embedded on submit and your top 5 talent matches show in 2-3 seconds.
          </div>
        </div>
      )}
    </Wizard>
    </>
  );
}
