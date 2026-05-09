// Free-text → structured profile extraction. The single biggest UX win:
// users paste a LinkedIn/resume/bio blurb and we fill in the wizard for them.

import { Hono } from 'hono';
import { z } from 'zod';
import { chatJSON } from '../lib/llm.ts';

export const extractRoutes = new Hono();

const ExtractedTalent = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  email: z.string().optional(),
  roleType: z.string().optional(),
  sectors: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  functions: z.array(z.string()).default([]),
  availability: z.string().optional(),
  stagePreference: z.array(z.string()).default([]),
  riskTolerance: z.string().optional(),
  compShape: z.array(z.string()).default([]),
  missionTags: z.array(z.string()).default([]),
  affiliations: z.array(z.string()).default([]),
  yearsExperience: z.number().optional(),
});

const SECTORS = ['life_sciences', 'ai', 'defense', 'cyber', 'energy', 'advanced_manufacturing', 'fintech', 'software'];
const ROLES = ['executive', 'cofounder', 'fractional', 'engineer', 'sales', 'marketing', 'student', 'intern', 'advisor', 'mentor', 'board', 'investor', 'service_provider'];
const AVAILS = ['full_time', 'fractional', 'advisory', 'internship', 'mentor'];
const STAGES = ['idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'growth'];
const RISK = ['low', 'medium', 'high'];
const COMP = ['salary', 'equity', 'advisor_equity', 'hourly', 'free'];
const MISSIONS = ['patient_outcomes', 'deep_science', 'hard_tech', 'sustainability', 'defense', 'productivity'];
const AFFILIATIONS = ['u_of_u', 'byu', 'usu', 'recursion', 'qualtrics', 'domo', 'pluralsight', 'sarcos', 'silicon_slopes', 'park_city'];
const FUNCTIONS = ['regulatory', 'sales', 'product', 'engineering', 'finance', 'operations'];

extractRoutes.post('/talent', async (c) => {
  const { text } = z.object({ text: z.string().min(1).max(15000) }).parse(await c.req.json());

  const sys = `You extract a structured talent profile from a free-text bio, resume snippet, or LinkedIn paste. Return STRICT JSON matching this shape:

{
  "name": string | null,
  "headline": string (one-line, max 120 chars, concrete — e.g. "Ex-Recursion VP Regulatory · led 2 FDA Class III submissions"),
  "bio": string (2–4 sentences, third person OK, focused on what they've done and what they want next),
  "location": string | null (e.g. "Salt Lake City, UT"),
  "email": string | null,
  "roleType": one of [${ROLES.map((r) => `"${r}"`).join(', ')}],
  "sectors": subset of [${SECTORS.map((s) => `"${s}"`).join(', ')}],
  "skills": string[] (5–8 specific phrases — "FDA Class III", "neural interfaces", not "leadership"),
  "functions": subset of [${FUNCTIONS.map((f) => `"${f}"`).join(', ')}],
  "availability": one of [${AVAILS.map((a) => `"${a}"`).join(', ')}],
  "stagePreference": subset of [${STAGES.map((s) => `"${s}"`).join(', ')}],
  "riskTolerance": one of [${RISK.map((r) => `"${r}"`).join(', ')}],
  "compShape": subset of [${COMP.map((c) => `"${c}"`).join(', ')}],
  "missionTags": subset of [${MISSIONS.map((m) => `"${m}"`).join(', ')}] (1–3),
  "affiliations": subset of [${AFFILIATIONS.map((a) => `"${a}"`).join(', ')}] — only include if explicitly mentioned,
  "yearsExperience": integer (best guess from context)
}

Rules:
- Be specific in skills/headline. Generic words like "leadership" or "team player" are forbidden.
- If something isn't in the text, leave it as null/[] — don't fabricate.
- "Ex-Recursion exec" → affiliations: ["recursion"]. "U of U PhD" → ["u_of_u"]. Match canonical ids.
- For sectors, infer from context (e.g. "ran clinical trials at Recursion" → ["life_sciences"]).
- For mission tags, pick what they care about (regulated healthcare → patient_outcomes; deep tech → deep_science/hard_tech).`;

  const out = await chatJSON<z.infer<typeof ExtractedTalent>>(
    [
      { role: 'system', content: sys },
      { role: 'user', content: text },
    ],
    { tier: 'smart', temperature: 0.2, maxTokens: 1200 }
  );

  // Filter to only valid taxonomy values
  const filterTo = (arr: string[] | undefined, allowed: string[]) =>
    (arr ?? []).filter((x) => allowed.includes(x));

  return c.json({
    name: out.name || undefined,
    headline: out.headline || undefined,
    bio: out.bio || undefined,
    location: out.location || undefined,
    email: out.email || undefined,
    roleType: ROLES.includes(out.roleType ?? '') ? out.roleType : 'executive',
    sectors: filterTo(out.sectors, SECTORS),
    skills: (out.skills ?? []).slice(0, 12),
    functions: filterTo(out.functions, FUNCTIONS),
    availability: AVAILS.includes(out.availability ?? '') ? out.availability : 'full_time',
    stagePreference: filterTo(out.stagePreference, STAGES),
    riskTolerance: RISK.includes(out.riskTolerance ?? '') ? out.riskTolerance : 'medium',
    compShape: filterTo(out.compShape, COMP),
    missionTags: filterTo(out.missionTags, MISSIONS),
    affiliations: filterTo(out.affiliations, AFFILIATIONS),
    yearsExperience: typeof out.yearsExperience === 'number' ? out.yearsExperience : 5,
  });
});

const ExtractedStartup = z.object({
  name: z.string().optional(),
  oneliner: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  sector: z.string().optional(),
  origin: z.string().optional(),
  trl: z.number().optional(),
  fundingStage: z.string().optional(),
  fundingRaisedUsd: z.number().optional(),
  fundingSources: z.array(z.string()).default([]),
  immediateNeeds: z.array(z.string()).default([]),
  missionTags: z.array(z.string()).default([]),
  utahRoots: z.array(z.string()).default([]),
});

const ORIGINS = ['u_of_u_lab', 'byu_lab', 'usu_lab', 'bootstrapped', 'corporate_spinout'];
const NEEDS = ['ceo', 'cto', 'coo', 'cfo', 'cmo', 'regulatory', 'biz_dev', 'sales', 'marketing', 'engineer', 'advisor'];
const SOURCES = ['nih', 'nsf_sbir', 'venture', 'angel', 'grant'];
const ROOTS = ['u_of_u', 'byu', 'usu', 'silicon_slopes', 'park_city'];

extractRoutes.post('/startup', async (c) => {
  const { text } = z.object({ text: z.string().min(1).max(15000) }).parse(await c.req.json());

  const sys = `You extract a structured startup profile from a free-text description (pitch, abstract, lab page, deck excerpt). Return STRICT JSON:

{
  "name": string,
  "oneliner": string (one sentence, max 130 chars, what they do — concrete, no buzzwords),
  "description": string (3–5 sentences: origin → state → near-term need),
  "location": string | null,
  "website": string | null,
  "sector": one of [${SECTORS.map((s) => `"${s}"`).join(', ')}],
  "origin": one of [${ORIGINS.map((o) => `"${o}"`).join(', ')}],
  "trl": integer 1..9,
  "fundingStage": one of [${STAGES.map((s) => `"${s}"`).join(', ')}],
  "fundingRaisedUsd": integer (0 if unstated),
  "fundingSources": subset of [${SOURCES.map((s) => `"${s}"`).join(', ')}],
  "immediateNeeds": subset of [${NEEDS.map((n) => `"${n}"`).join(', ')}] (2–4 most pressing),
  "missionTags": subset of [${MISSIONS.map((m) => `"${m}"`).join(', ')}] (1–3),
  "utahRoots": subset of [${ROOTS.map((r) => `"${r}"`).join(', ')}]
}

Rules:
- Don't fabricate names or websites.
- Infer TRL conservatively from text (pre-clinical = 4–5, in-market = 8–9).
- Immediate needs should be specific to what's described, not generic.`;

  const out = await chatJSON<z.infer<typeof ExtractedStartup>>(
    [
      { role: 'system', content: sys },
      { role: 'user', content: text },
    ],
    { tier: 'smart', temperature: 0.2, maxTokens: 1200 }
  );

  const filterTo = (arr: string[] | undefined, allowed: string[]) =>
    (arr ?? []).filter((x) => allowed.includes(x));

  return c.json({
    name: out.name || undefined,
    oneliner: out.oneliner || undefined,
    description: out.description || undefined,
    location: out.location || undefined,
    website: out.website || undefined,
    sector: SECTORS.includes(out.sector ?? '') ? out.sector : 'software',
    origin: ORIGINS.includes(out.origin ?? '') ? out.origin : 'bootstrapped',
    trl: typeof out.trl === 'number' ? Math.max(1, Math.min(9, out.trl)) : 4,
    fundingStage: STAGES.includes(out.fundingStage ?? '') ? out.fundingStage : 'pre_seed',
    fundingRaisedUsd: typeof out.fundingRaisedUsd === 'number' ? out.fundingRaisedUsd : 0,
    fundingSources: filterTo(out.fundingSources, SOURCES),
    immediateNeeds: filterTo(out.immediateNeeds, NEEDS),
    missionTags: filterTo(out.missionTags, MISSIONS),
    utahRoots: filterTo(out.utahRoots, ROOTS),
  });
});
