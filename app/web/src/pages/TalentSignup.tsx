import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wizard, MultiSelect, Choice, type Step } from '@/components/Wizard.tsx';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast.tsx';
import { Sparkles, Loader2, Briefcase, Heart, GraduationCap, DollarSign, Wrench } from 'lucide-react';
import { NextStepsStrip } from '@/components/NextStepsStrip.tsx';

const steps: Step[] = [
  { id: 'paste', title: 'Quick start', subtitle: 'Paste a bio or fill manually' },
  { id: 'who', title: 'Who you are', subtitle: 'Identity + headline' },
  { id: 'expertise', title: 'Expertise', subtitle: 'Skills, sectors, role' },
  { id: 'fit', title: 'Fit shape', subtitle: 'Availability + comp + risk' },
  { id: 'mission', title: 'Mission', subtitle: 'What you care about' },
];

const SECTORS = [
  { value: 'life_sciences', label: 'Life Sciences' },
  { value: 'ai', label: 'AI' },
  { value: 'defense', label: 'Defense / Aerospace' },
  { value: 'cyber', label: 'Cyber' },
  { value: 'energy', label: 'Energy' },
  { value: 'advanced_manufacturing', label: 'Advanced Manufacturing' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'software', label: 'Software' },
];

const ALL_ROLES = [
  { value: 'executive', label: 'Executive (CEO/CTO/COO)' },
  { value: 'cofounder', label: 'Cofounder' },
  { value: 'fractional', label: 'Fractional operator' },
  { value: 'engineer', label: 'Engineer / technical IC' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'student', label: 'Student' },
  { value: 'intern', label: 'Intern' },
  { value: 'advisor', label: 'Advisor (paid in equity)' },
  { value: 'mentor', label: 'Mentor (free)' },
  { value: 'board', label: 'Board member' },
  { value: 'investor', label: 'Investor' },
  { value: 'service_provider', label: 'Service provider' },
];

interface BucketConfig {
  key: string; label: string; Icon: typeof Briefcase; accent: string;
  intro: string;
  roleValues: string[];
  defaultRole: string;
  defaultAvailability: string;
  defaultCompShape: string[];
  skillsLabel: string;
  skillsPlaceholder: string;
  bioPlaceholder: string;
}

const BUCKETS: Record<string, BucketConfig> = {
  operator: {
    key: 'operator', label: 'Operators / Executives', Icon: Briefcase, accent: 'bg-nucleus-accent/15 text-nucleus-accent',
    intro: 'Lead an early-stage Utah deep-tech company. Full-time or fractional.',
    roleValues: ['executive', 'cofounder', 'fractional', 'engineer', 'sales', 'marketing', 'student', 'intern', 'board'],
    defaultRole: 'executive',
    defaultAvailability: 'full_time',
    defaultCompShape: ['salary', 'equity'],
    skillsLabel: 'Skills (comma-separated)',
    skillsPlaceholder: 'FDA Class III, IND filings, regulatory strategy, pre-clinical operations',
    bioPlaceholder: 'e.g. Spent 9 years at Recursion as VP Regulatory leading two FDA Class III submissions. Looking for an early-stage life-sciences CEO seat where regulatory is the rate-limiting step…',
  },
  mentor: {
    key: 'mentor', label: 'Mentors (free)', Icon: Heart, accent: 'bg-rose-100 text-rose-700',
    intro: 'You\'ve been there before and you want to give time. Match to founders whose problems you have actually solved.',
    roleValues: ['mentor'],
    defaultRole: 'mentor',
    defaultAvailability: 'mentor',
    defaultCompShape: ['free'],
    skillsLabel: 'Areas you can help with',
    skillsPlaceholder: 'fundraising, hiring, go-to-market, founder-investor dynamics, scaling product',
    bioPlaceholder: 'e.g. Two SaaS exits ($60M and $400M). Now want to give back — happy to give 2 hours/month to early-stage founders, especially first-timers in vertical SaaS or fintech.',
  },
  sme: {
    key: 'sme', label: 'Subject-Matter Experts', Icon: GraduationCap, accent: 'bg-violet-100 text-violet-700',
    intro: 'Domain depth in life sciences, AI, defense, energy, advanced manufacturing, cyber, fintech, or software. Take an advisory shareholder seat where your expertise is rate-limiting.',
    roleValues: ['advisor', 'board'],
    defaultRole: 'advisor',
    defaultAvailability: 'advisory',
    defaultCompShape: ['advisor_equity'],
    skillsLabel: 'Domain expertise (comma-separated)',
    skillsPlaceholder: 'pediatric oncology, CNS tumors, NIH grants, FDA Breakthrough designation',
    bioPlaceholder: 'e.g. Postdoc at Huntsman Cancer Institute, focus on diffuse midline glioma. Want to advise a pediatric-onc startup where my translational research overlaps the indication.',
  },
  investor: {
    key: 'investor', label: 'Angel Investors / VCs', Icon: DollarSign, accent: 'bg-emerald-100 text-emerald-700',
    intro: 'See Utah-rooted deals before they hit your inbox. We match on stage thesis, sector thesis, and check size.',
    roleValues: ['investor'],
    defaultRole: 'investor',
    defaultAvailability: 'advisory',
    defaultCompShape: ['equity'],
    skillsLabel: 'Thesis & check (free-form, comma-separated)',
    skillsPlaceholder: 'seed checks $250k-1.5M, lead or co-lead, FDA reg pathway diligence, board seats',
    bioPlaceholder: 'e.g. Solo GP at Wasatch Bio Capital. Writes $250k–$1.5M seed checks, lead or co-lead. Thesis: Utah-rooted life-sciences and bioengineering — especially anything coming out of Huntsman, U of U, or Recursion alumni founders.',
  },
  service_provider: {
    key: 'service_provider', label: 'Service Providers', Icon: Wrench, accent: 'bg-amber-100 text-amber-700',
    intro: 'Be visible to the founders who need you. Match on practice area, sector experience, and stage you serve.',
    roleValues: ['service_provider'],
    defaultRole: 'service_provider',
    defaultAvailability: 'fractional',
    defaultCompShape: ['salary', 'equity'],
    skillsLabel: 'Practice area & specialties (comma-separated)',
    skillsPlaceholder: 'FDA regulatory law, IND filings, pre-IND meetings, equity-for-services',
    bioPlaceholder: 'e.g. Solo regulatory attorney specializing in pre-IND meetings, IND submissions, and Class III device pathways. Twelve IND filings over six years; flat-fee or retainer for early-stage.',
  },
};

function bucketFor(key: string | null): BucketConfig {
  return BUCKETS[key ?? 'operator'] ?? BUCKETS.operator;
}

export function TalentSignup() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const bucket = useMemo(() => bucketFor(params.get('bucket')), [params]);
  const ROLES = useMemo(() => ALL_ROLES.filter((r) => bucket.roleValues.includes(r.value)), [bucket]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const [roleType, setRoleType] = useState(bucket.defaultRole);
  const [sectors, setSectors] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [yearsExperience, setYearsExperience] = useState(10);

  const [availability, setAvailability] = useState(bucket.defaultAvailability);
  const [stagePreference, setStagePreference] = useState<string[]>(['seed', 'series_a']);
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [compShape, setCompShape] = useState<string[]>(bucket.defaultCompShape);

  const [missionTags, setMissionTags] = useState<string[]>([]);
  const [affiliations, setAffiliations] = useState<string[]>([]);

  // When bucket changes (e.g. user navigates between bucket-specific signups),
  // realign the bucket-driven defaults so the form matches the new path.
  useEffect(() => {
    setRoleType(bucket.defaultRole);
    setAvailability(bucket.defaultAvailability);
    setCompShape(bucket.defaultCompShape);
  }, [bucket.key]);

  async function runExtraction() {
    if (!pasteText.trim()) return;
    setExtracting(true);
    try {
      const r = await api.extractTalent(pasteText);
      if (r.name) setName(r.name);
      if (r.headline) setHeadline(r.headline);
      if (r.bio) setBio(r.bio);
      if (r.location) setLocation(r.location);
      if (r.email) setEmail(r.email);
      if (r.roleType) setRoleType(r.roleType);
      if (r.sectors.length) setSectors(r.sectors);
      if (r.skills.length) setSkills(r.skills.join(', '));
      if (r.availability) setAvailability(r.availability);
      if (r.stagePreference.length) setStagePreference(r.stagePreference);
      if (r.riskTolerance) setRiskTolerance(r.riskTolerance);
      if (r.compShape.length) setCompShape(r.compShape);
      if (r.missionTags.length) setMissionTags(r.missionTags);
      if (r.affiliations.length) setAffiliations(r.affiliations);
      if (r.yearsExperience) setYearsExperience(r.yearsExperience);
      toast(`Extracted ${r.skills.length} skills, ${r.sectors.length} sectors, ${r.affiliations.length} affiliations. Review the next steps and adjust.`, 'success');
      setStep(1);
    } catch (e) {
      toast(`Extraction failed: ${(e as Error).message}`, 'error');
    } finally {
      setExtracting(false);
    }
  }

  const canNext =
    step === 0 ? true :                                                    // paste step is always skippable
    step === 1 ? name.trim() && headline.trim() :
    step === 2 ? sectors.length > 0 && skills.trim() :
    step === 3 ? compShape.length > 0 :
    true;

  async function submit() {
    setSubmitting(true);
    try {
      const r = await api.createTalent({
        name, headline, bio, email: email || undefined, location: location || undefined,
        roleType, sectors,
        skills: skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
        functions: derivedFunctions(roleType),
        availability, stagePreference, riskTolerance, compShape,
        missionTags, affiliations, yearsExperience,
      });
      toast('Profile created. Computing matches…', 'success');
      nav(`/talent/${r.id}`);
    } catch (e) {
      toast(`Couldn't save: ${(e as Error).message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const BucketIcon = bucket.Icon;
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bucket.accent}`}>
            <BucketIcon className="w-3.5 h-3.5" />
            {bucket.label}
          </span>
          <span className="text-xs text-nucleus-subtle">{bucket.intro}</span>
          <a href="/join" className="ml-auto text-xs text-nucleus-subtle hover:text-nucleus-ink underline">Switch path</a>
        </div>
        <div className="mt-4">
          <NextStepsStrip side="talent" />
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
            <h2 className="display text-2xl font-semibold">Skip the form. Paste your bio.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">Drop in a LinkedIn summary, resume excerpt, or a paragraph about yourself. We'll fill in the rest — you'll review every field before submitting.</p>
          </div>
          <textarea
            className="input"
            rows={9}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={bucket.bioPlaceholder}
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
          <div className="card bg-nucleus-cream/60 p-4 text-xs text-nucleus-subtle">
            <span className="font-semibold text-nucleus-ink">Privacy:</span> we only use this text to populate the form below. Nothing is stored until you click Submit on the final step.
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">Who you are.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">A few facts so the matcher knows what to compare you against.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" />
            </div>
            <div className="md:col-span-2">
              <label className="label">One-line headline</label>
              <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Ex-Recursion VP Regulatory · led 2 FDA Class III submissions" />
              <div className="helper">This shows up first in match surfaces, so make it concrete.</div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Short bio</label>
              <textarea className="input" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What you've done, what you're looking for next." />
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
            <h2 className="display text-2xl font-semibold">Your expertise.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">The matcher uses these to find startups whose needs you can actually fill.</p>
          </div>
          <div>
            <label className="label">Role type</label>
            <select className="input" value={roleType} onChange={(e) => setRoleType(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sectors you know</label>
            <MultiSelect options={SECTORS} value={sectors} onChange={setSectors} cols={3} />
          </div>
          <div>
            <label className="label">{bucket.skillsLabel}</label>
            <textarea className="input" rows={3} value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder={bucket.skillsPlaceholder} />
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input type="number" className="input max-w-xs" value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))} min={0} max={50} />
          </div>
          <div>
            <label className="label">Affiliations (helps the network bridge)</label>
            <MultiSelect
              options={[
                { value: 'u_of_u', label: 'University of Utah' },
                { value: 'byu', label: 'BYU' },
                { value: 'usu', label: 'Utah State' },
                { value: 'recursion', label: 'Recursion' },
                { value: 'qualtrics', label: 'Qualtrics' },
                { value: 'domo', label: 'Domo' },
                { value: 'pluralsight', label: 'Pluralsight' },
                { value: 'sarcos', label: 'Sarcos' },
                { value: 'silicon_slopes', label: 'Silicon Slopes' },
                { value: 'park_city', label: 'Park City' },
              ]}
              value={affiliations}
              onChange={setAffiliations}
              cols={3}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">How you want to engage.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">Hard filters, not preferences — we won't show you things outside this shape.</p>
          </div>
          <div>
            <label className="label">Availability</label>
            <Choice
              value={availability}
              onChange={setAvailability}
              options={[
                { value: 'full_time', label: 'Full-time', helper: 'Salary or equity-heavy.' },
                { value: 'fractional', label: 'Fractional', helper: 'Multiple companies at once.' },
                { value: 'advisory', label: 'Advisory', helper: 'Equity-paid advisor seat.' },
                { value: 'internship', label: 'Internship', helper: 'Hourly / part-time.' },
                { value: 'mentor', label: 'Mentor (free)', helper: "I want to help, no comp." },
              ]}
            />
          </div>
          <div>
            <label className="label">Stage you're comfortable with</label>
            <MultiSelect
              value={stagePreference}
              onChange={setStagePreference}
              options={[
                { value: 'idea', label: 'Idea' },
                { value: 'pre_seed', label: 'Pre-seed' },
                { value: 'seed', label: 'Seed' },
                { value: 'series_a', label: 'Series A' },
                { value: 'series_b', label: 'Series B' },
                { value: 'growth', label: 'Growth' },
              ]}
              cols={3}
            />
          </div>
          <div>
            <label className="label">Risk tolerance</label>
            <Choice
              value={riskTolerance}
              onChange={setRiskTolerance}
              options={[
                { value: 'low', label: 'Low', helper: 'Established companies only.' },
                { value: 'medium', label: 'Medium', helper: 'Growth-stage with revenue.' },
                { value: 'high', label: 'High', helper: 'Pre-seed/seed deep tech.' },
              ]}
            />
          </div>
          <div>
            <label className="label">Comp shape</label>
            <MultiSelect
              value={compShape}
              onChange={setCompShape}
              options={[
                { value: 'salary', label: 'Salary' },
                { value: 'equity', label: 'Equity' },
                { value: 'advisor_equity', label: 'Advisor equity' },
                { value: 'hourly', label: 'Hourly' },
                { value: 'free', label: 'Free (mentor)' },
              ]}
              cols={3}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="display text-2xl font-semibold">What you care about.</h2>
            <p className="text-sm text-nucleus-subtle mt-1">The matcher gives extra weight to mission alignment — picks of 1-3 are best.</p>
          </div>
          <MultiSelect
            value={missionTags}
            onChange={setMissionTags}
            options={[
              { value: 'patient_outcomes', label: 'Patient outcomes', helper: 'Healthcare-impact-driven work.' },
              { value: 'deep_science', label: 'Deep science', helper: 'PhD-grade research, hard problems.' },
              { value: 'hard_tech', label: 'Hard tech', helper: 'Atoms not bits.' },
              { value: 'sustainability', label: 'Sustainability', helper: 'Energy, climate, ag.' },
              { value: 'defense', label: 'Defense / national security' },
              { value: 'productivity', label: 'Productivity', helper: 'Software that makes work easier.' },
            ]}
            cols={2}
          />
          <div className="card bg-nucleus-cream/60 p-4 text-sm">
            <span className="font-medium">You'll see top matches in seconds.</span> The matcher computes embeddings on submit and runs a hard-filter + multi-vector + LLM-rerank pass before showing your top 5.
          </div>
        </div>
      )}
    </Wizard>
    </>
  );
}

function derivedFunctions(roleType: string): string[] {
  const map: Record<string, string[]> = {
    executive: ['operations', 'finance'],
    cofounder: ['operations', 'product'],
    fractional: ['operations'],
    engineer: ['engineering'],
    sales: ['sales'],
    marketing: ['operations'],
    student: ['engineering'],
    intern: ['engineering'],
    advisor: ['operations'],
    mentor: ['operations'],
    board: ['operations'],
    investor: ['finance'],
    service_provider: ['operations'],
  };
  return map[roleType] ?? ['operations'];
}
