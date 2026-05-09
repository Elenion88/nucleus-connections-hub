// Matching engine.
// Pipeline: hard filters → multi-vector cosine → Utah-roots/affiliation boost → LLM rerank+explain → cache.

import { db, schema, sqlite } from '../db/index.ts';
import { eq } from 'drizzle-orm';
import type { Talent, Startup } from '../db/schema.ts';
import { chatJSON, cosine } from './llm.ts';
import { createHash } from 'node:crypto';

export interface MatchResult {
  talentId: string;
  startupId: string;
  score: number;                         // 0..100
  dimensions: {
    skills: number;                      // 0..100
    sector: number;
    stage: number;
    mission: number;
    network: number;
  };
  whyBullets: string[];
  gaps: string[];
  talkingPoints: string[];
  cached: boolean;
}

const ROLE_WEIGHTS: Record<string, { skills: number; sector: number; stage: number; mission: number; network: number }> = {
  executive:    { skills: 0.30, sector: 0.20, stage: 0.15, mission: 0.20, network: 0.15 },
  cofounder:    { skills: 0.25, sector: 0.20, stage: 0.20, mission: 0.25, network: 0.10 },
  fractional:   { skills: 0.35, sector: 0.20, stage: 0.20, mission: 0.10, network: 0.15 },
  engineer:     { skills: 0.50, sector: 0.15, stage: 0.10, mission: 0.10, network: 0.15 },
  sales:        { skills: 0.40, sector: 0.20, stage: 0.15, mission: 0.10, network: 0.15 },
  marketing:    { skills: 0.40, sector: 0.20, stage: 0.15, mission: 0.10, network: 0.15 },
  student:      { skills: 0.20, sector: 0.20, stage: 0.10, mission: 0.30, network: 0.20 },
  intern:       { skills: 0.20, sector: 0.20, stage: 0.10, mission: 0.30, network: 0.20 },
  advisor:      { skills: 0.30, sector: 0.30, stage: 0.10, mission: 0.10, network: 0.20 },
  mentor:       { skills: 0.20, sector: 0.30, stage: 0.10, mission: 0.20, network: 0.20 },
  board:        { skills: 0.20, sector: 0.30, stage: 0.20, mission: 0.10, network: 0.20 },
  // Investors: stage thesis (round size proxy) + sector thesis dominate. Skills here
  // encode check size + diligence specialty; mission/network are softer signals.
  investor:     { skills: 0.20, sector: 0.30, stage: 0.30, mission: 0.05, network: 0.15 },
  // Service providers (legal, creative, agency): skills = practice area, sector =
  // domain experience. Stage matters less; mission softer.
  service_provider: { skills: 0.40, sector: 0.30, stage: 0.10, mission: 0.05, network: 0.15 },
};

const STAGE_ORDER = ['idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'growth'];

function pipeSet(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(s.split('|').filter(Boolean));
}

function passHardFilters(t: Talent, s: Startup): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Stage compatibility — if the talent listed any stage prefs, the startup must overlap
  const tStages = pipeSet(t.stagePreference);
  if (tStages.size > 0 && !tStages.has(s.fundingStage)) {
    reasons.push(`stage mismatch (talent prefers ${[...tStages].join('/')}, startup is ${s.fundingStage})`);
  }

  // Comp shape ↔ availability ↔ startup stage sanity
  const compShape = pipeSet(t.compShape);
  const earlyStage = ['idea', 'pre_seed', 'seed'].includes(s.fundingStage);
  if (earlyStage && t.availability === 'full_time' && !compShape.has('equity') && !compShape.has('salary')) {
    reasons.push('comp shape incompatible with early-stage full-time');
  }

  // Mentors are free — only relevant when startup needs an advisor or is exploring
  if (t.availability === 'mentor' && !pipeSet(s.immediateNeeds).has('advisor')) {
    // not a hard fail, just down-rank — don't block
  }

  return { ok: reasons.length === 0, reasons };
}

// Categorical "exact sector" → graded 75-100 using skills-cosine as the
// within-sector specificity signal. Two life-sciences candidates whose skill
// embeddings differ in sub-domain (pediatric onc vs. neural interfaces) now
// land at materially different sector scores even though both share the tag.
function sectorScore(t: Talent, s: Startup, skillsCosine: number): number {
  // Map cosine [-1, 1] → [0, 1], slightly biased so realistic 0.3-0.8 cosines
  // give a useful spread rather than all rounding to ~0.7.
  const refine = Math.max(0, Math.min(1, (skillsCosine + 0.15) / 1.0));
  const tSectors = pipeSet(t.sectors);

  if (tSectors.has(s.sector)) {
    return Math.round(75 + 25 * refine);   // 75–100
  }
  const adjacent: Record<string, string[]> = {
    life_sciences: ['ai', 'advanced_manufacturing'],
    ai: ['software', 'cyber', 'life_sciences', 'defense'],
    defense: ['cyber', 'ai', 'advanced_manufacturing'],
    cyber: ['software', 'ai', 'defense'],
    energy: ['advanced_manufacturing'],
    advanced_manufacturing: ['energy', 'defense', 'life_sciences'],
    fintech: ['software', 'ai'],
    software: ['ai', 'cyber', 'fintech'],
  };
  const adj = adjacent[s.sector] ?? [];
  for (const a of adj) if (tSectors.has(a)) {
    return Math.round(35 + 20 * refine); // 35–55
  }
  return Math.round(8 + 12 * refine);    // 8–20
}

// Stage: exact match still strong, but specificity matters — a candidate
// listing a single stage preference is a sharper signal than one listing five.
function stageScore(t: Talent, s: Startup): number {
  const tStages = pipeSet(t.stagePreference);
  if (tStages.size === 0) return 65;
  if (tStages.has(s.fundingStage)) {
    // 1 stage → 100 (highly committed); 2 → 92; 3 → 86; 4+ → 80
    if (tStages.size === 1) return 100;
    if (tStages.size === 2) return 92;
    if (tStages.size === 3) return 86;
    return 80;
  }
  const sIdx = STAGE_ORDER.indexOf(s.fundingStage);
  let best = 0;
  for (const st of tStages) {
    const i = STAGE_ORDER.indexOf(st);
    if (i < 0) continue;
    const dist = Math.abs(i - sIdx);
    best = Math.max(best, Math.max(0, 78 - dist * 22));
  }
  return best;
}

function networkScore(t: Talent, s: Startup): number {
  const tAff = pipeSet(t.affiliations);
  const sRoots = pipeSet(s.utahRoots);
  let overlap = 0;
  for (const a of tAff) if (sRoots.has(a)) overlap += 1;
  if (overlap === 0) {
    const utahInst = ['u_of_u', 'byu', 'usu', 'silicon_slopes'];
    const tHasUtah = utahInst.some((x) => tAff.has(x));
    const sHasUtah = utahInst.some((x) => sRoots.has(x));
    return tHasUtah && sHasUtah ? 35 : 10;
  }
  // Smoother gradient: 1 → 70, 2 → 85, 3 → 100
  return Math.min(100, 55 + overlap * 15);
}

interface VecRow {
  skills_embedding: string | null;
  mission_embedding: string | null;
  experience_embedding?: string | null;
  description_embedding?: string | null;
  needs_embedding?: string | null;
}

function vec(s: string | null | undefined): number[] | null {
  if (!s) return null;
  try { return JSON.parse(s) as number[]; } catch { return null; }
}

function rolePrefix(roleType: string): string {
  return roleType.replace(/_.*$/, '').toLowerCase();
}

export interface RawScored {
  startup: Startup;
  talent: Talent;
  score: number;
  dimensions: { skills: number; sector: number; stage: number; mission: number; network: number };
  hardFilterReasons: string[];
}

export function rawScore(t: Talent, s: Startup): RawScored {
  const tSkills = vec(t.skillsEmbedding ?? null);
  const tMission = vec(t.missionEmbedding ?? null);
  const tExp = vec(t.experienceEmbedding ?? null);
  const sNeeds = vec(s.needsEmbedding ?? null);
  const sMission = vec(s.missionEmbedding ?? null);
  const sDesc = vec(s.descriptionEmbedding ?? null);

  const skillsCosine = tSkills && sNeeds ? cosine(tSkills, sNeeds) : 0;
  const missionCosine = tMission && sMission ? cosine(tMission, sMission) : 0;
  const expCosine = tExp && sDesc ? cosine(tExp, sDesc) : 0;

  // Map cosine [-1,1] → [0,100], biased so 0.5 maps near 75
  const cosTo100 = (c: number) => Math.max(0, Math.min(100, Math.round(50 + 100 * c)));

  const dim = {
    skills: Math.round(0.7 * cosTo100(skillsCosine) + 0.3 * cosTo100(expCosine)),
    sector: sectorScore(t, s, skillsCosine),
    stage: stageScore(t, s),
    mission: cosTo100(missionCosine),
    network: networkScore(t, s),
  };

  const role = rolePrefix(t.roleType);
  const w = ROLE_WEIGHTS[role] ?? ROLE_WEIGHTS.executive;
  const score = Math.round(
    w.skills * dim.skills +
    w.sector * dim.sector +
    w.stage * dim.stage +
    w.mission * dim.mission +
    w.network * dim.network
  );

  const hard = passHardFilters(t, s);
  const finalScore = hard.ok ? score : Math.round(score * 0.6);

  return { talent: t, startup: s, score: finalScore, dimensions: dim, hardFilterReasons: hard.reasons };
}

function cacheKey(talentId: string, startupId: string) {
  return createHash('sha1').update(`${talentId}|${startupId}`).digest('hex');
}

export interface Suggestion { title: string; body: string; dimension: string; points: number }

export function getCachedExplanation(talentId: string, startupId: string) {
  const key = cacheKey(talentId, startupId);
  const row = sqlite.prepare('SELECT * FROM match_cache WHERE id = ?').get(key) as any;
  if (!row) return null;
  const tp = JSON.parse(row.talking_points) as string[];
  let headline = '';
  let talkingPoints = tp;
  if (tp.length > 0 && tp[0].startsWith('__headline__:')) {
    headline = tp[0].replace('__headline__:', '');
    talkingPoints = tp.slice(1);
  }
  let suggestions: Suggestion[] = [];
  try { if (row.suggestions) suggestions = JSON.parse(row.suggestions); } catch { /* ignore */ }
  return {
    score: row.score as number,
    dimensions: JSON.parse(row.dimensions),
    whyBullets: JSON.parse(row.why_bullets) as string[],
    gaps: JSON.parse(row.gaps) as string[],
    talkingPoints,
    headline,
    suggestions,
    outreachDraft: (row.outreach_draft as string | null) ?? '',
  };
}

export function saveExplanation(
  talentId: string,
  startupId: string,
  score: number,
  dimensions: RawScored['dimensions'],
  whyBullets: string[],
  gaps: string[],
  talkingPoints: string[],
  headline: string = '',
  suggestions: Suggestion[] = [],
  outreachDraft: string = '',
) {
  const key = cacheKey(talentId, startupId);
  sqlite
    .prepare(
      `INSERT INTO match_cache (id, talent_id, startup_id, score, dimensions, why_bullets, gaps, talking_points, suggestions, outreach_draft, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET score=excluded.score, dimensions=excluded.dimensions,
         why_bullets=excluded.why_bullets, gaps=excluded.gaps, talking_points=excluded.talking_points,
         suggestions=excluded.suggestions, outreach_draft=excluded.outreach_draft,
         generated_at=excluded.generated_at`
    )
    .run(
      key,
      talentId,
      startupId,
      score,
      JSON.stringify(dimensions),
      JSON.stringify(whyBullets),
      JSON.stringify(gaps),
      // Pack headline as the first array element prefixed with "__headline__:" so we don't need a schema change
      JSON.stringify(headline ? [`__headline__:${headline}`, ...talkingPoints] : talkingPoints),
      JSON.stringify(suggestions),
      outreachDraft,
      Math.floor(Date.now() / 1000)
    );
}

export async function explainMatch(t: Talent, s: Startup, scored: RawScored): Promise<{
  headline: string;
  whyBullets: string[];
  gaps: string[];
  talkingPoints: string[];
  suggestions: Suggestion[];
  outreachDraft: string;
}> {
  const sys = `You are an analyst for The Nucleus Institute, a Utah deep-tech matchmaking org.
Given a talent profile and a startup profile, write a tight, specific explanation of why they are a match.
Be concrete: cite specific skills, affiliations, sectors, mission tags, or experience that overlap.
Do not be generic ("strong leader"). Do not flatter. If the fit is partial, say so honestly.
Return STRICT JSON with SIX keys:
- headline (string): one declarative sentence, <= 28 words, that names the single sharpest reason this match makes sense. Use real names. Example: "Sarah's two FDA Class III submissions at Recursion are exactly the regulatory bench NeuroTouch needs to clear its 18-month Breakthrough Device pathway."
- why (string[3]): three more reasons, one sentence each, <= 22 words.
- gaps (string[1..2]): partial-fit caveats, honest, one sentence each.
- talkingPoints (string[2]): concrete questions for the intro conversation.
- suggestions (array of 2-3 objects): specific actionable steps the TALENT could take to close their weakest dimension and improve this match's score. Each object has:
    title (string, <= 8 words, imperative — e.g. "Reach out to Olivia Park"),
    body (string, one sentence, <= 24 words, naming a SPECIFIC person/course/event/credential. No generic advice.),
    dimension (one of: skills | sector | stage | mission | network — which dim this lifts),
    points (integer 2-8 — estimated point lift on the composite score).
  The suggestions must reference real names, real institutions, real skills from the profiles. Never say "consider gaining experience" — name the lab, the certification, the person.
- outreach (string, 80-130 words): a first email the TALENT could send DIRECTLY to the startup founders. Tone: warm, specific, confident, no business-jargon. Open with a single concrete reference to the startup's actual situation (cite their oneliner, their TRL, their immediate needs). Middle: one sentence on why the talent is uniquely useful, citing one specific thing from their bio. Close: a soft ask for a 20-minute conversation. Do not include subject line or signature placeholders. No markdown formatting. Just the body.`;

  const user = `TALENT
Name: ${t.name}
Headline: ${t.headline}
Role type: ${t.roleType}
Sectors: ${t.sectors}
Skills: ${t.skills}
Functions: ${t.functions}
Mission tags: ${t.missionTags}
Affiliations: ${t.affiliations}
Availability: ${t.availability}; Stage pref: ${t.stagePreference}; Risk: ${t.riskTolerance}
Years experience: ${t.yearsExperience}
Bio: ${t.bio}

STARTUP
Name: ${s.name}
Oneliner: ${s.oneliner}
Sector: ${s.sector}; Origin: ${s.origin}; Stage: ${s.fundingStage}; TRL: ${s.trl ?? '?'}
Immediate needs: ${s.immediateNeeds}
Mission tags: ${s.missionTags}
Utah roots: ${s.utahRoots}
Description: ${s.description}

Per-dimension fit (0-100): skills=${scored.dimensions.skills}, sector=${scored.dimensions.sector}, stage=${scored.dimensions.stage}, mission=${scored.dimensions.mission}, network=${scored.dimensions.network}. Composite=${scored.score}.`;

  const out = await chatJSON<{
    headline: string; why: string[]; gaps: string[]; talkingPoints: string[];
    suggestions: Suggestion[]; outreach: string;
  }>(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { tier: 'smart', temperature: 0.45, maxTokens: 1200 }
  );
  return {
    headline: out.headline ?? '',
    whyBullets: (out.why ?? []).slice(0, 3),
    gaps: (out.gaps ?? []).slice(0, 2),
    talkingPoints: (out.talkingPoints ?? []).slice(0, 2),
    suggestions: (out.suggestions ?? []).slice(0, 3).map((s) => ({
      title: String(s.title ?? '').slice(0, 80),
      body: String(s.body ?? '').slice(0, 240),
      dimension: ['skills', 'sector', 'stage', 'mission', 'network'].includes(s.dimension) ? s.dimension : 'network',
      points: Math.max(2, Math.min(8, Math.round(Number(s.points) || 3))),
    })),
    outreachDraft: String(out.outreach ?? '').slice(0, 1200),
  };
}

export async function topMatchesForTalent(talentId: string, k = 5) {
  const [t] = await db.select().from(schema.talent).where(eq(schema.talent.id, talentId));
  if (!t) throw new Error('talent not found');
  const startups = await db.select().from(schema.startup);
  const scored = startups.map((s) => rawScore(t, s));
  scored.sort((a, b) => b.score - a.score);
  const total = scored.length;
  return scored.slice(0, k).map((m, idx) => ({ ...m, rank: idx + 1, total }));
}

export async function topMatchesForStartup(startupId: string, k = 5) {
  const [s] = await db.select().from(schema.startup).where(eq(schema.startup.id, startupId));
  if (!s) throw new Error('startup not found');
  const talents = await db.select().from(schema.talent);
  const scored = talents.map((t) => rawScore(t, s));
  scored.sort((a, b) => b.score - a.score);
  const total = scored.length;
  return scored.slice(0, k).map((m, idx) => ({ ...m, rank: idx + 1, total }));
}
