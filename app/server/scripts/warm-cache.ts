// Pre-compute LLM-based explanations for the matches a judge is most likely
// to click during a demo. After this runs, every "Why?" click on those pairs
// returns instantly from the cache instead of waiting on Claude.
//
// Personas covered:
//   - Sarah Chen        (talent → top 5 startups)
//   - NeuroTouch Bio    (startup → top 6 operators)
//   - SiliCell Compute  (startup → top 5 operators)   — second story-mode startup
//   - Aerolith Defense  (startup → top 5 operators)   — third story-mode startup
//   - Mira Okonjo       (talent → top 5 startups)     — student → research scenario
//   - Tom Brigham       (talent → top 5 startups)     — operator → SaaS scenario
//
// Idempotent: skips pairs that already have a cached explanation.

import 'dotenv/config';
import { db, schema } from '../src/db/index.ts';
import { eq } from 'drizzle-orm';
import {
  topMatchesForTalent, topMatchesForStartup,
  rawScore, explainMatch, getCachedExplanation, saveExplanation,
} from '../src/lib/match.ts';

const TALENT_IDS = ['t_sarah_chen', 't_mira_okonjo', 't_tom_brigham'];
const STARTUP_IDS = ['st_neurotouch', 'st_silicell', 'st_aerolith'];
const TOP_K = 5;

async function warmTalent(talentId: string) {
  const [t] = await db.select().from(schema.talent).where(eq(schema.talent.id, talentId));
  if (!t) { console.log(`[skip] talent not found: ${talentId}`); return; }
  const matches = await topMatchesForTalent(talentId, TOP_K);
  console.log(`\n[talent] ${t.name} → ${matches.length} startups`);
  for (const m of matches) {
    await warmPair(talentId, m.startup.id);
  }
}

async function warmStartup(startupId: string) {
  const [s] = await db.select().from(schema.startup).where(eq(schema.startup.id, startupId));
  if (!s) { console.log(`[skip] startup not found: ${startupId}`); return; }
  const matches = await topMatchesForStartup(startupId, TOP_K);
  console.log(`\n[startup] ${s.name} → ${matches.length} operators`);
  for (const m of matches) {
    await warmPair(m.talent.id, startupId);
  }
}

async function warmPair(talentId: string, startupId: string) {
  const cached = getCachedExplanation(talentId, startupId);
  if (cached) {
    console.log(`  ✓ ${talentId} ↔ ${startupId} (cached)`);
    return;
  }
  const [t] = await db.select().from(schema.talent).where(eq(schema.talent.id, talentId));
  const [s] = await db.select().from(schema.startup).where(eq(schema.startup.id, startupId));
  if (!t || !s) { console.log(`  ! ${talentId} ↔ ${startupId} (missing record)`); return; }
  const scored = rawScore(t, s);
  try {
    const explained = await explainMatch(t, s, scored);
    saveExplanation(
      talentId, startupId, scored.score, scored.dimensions,
      explained.whyBullets, explained.gaps, explained.talkingPoints, explained.headline,
      explained.suggestions, explained.outreachDraft,
    );
    console.log(`  + ${talentId} ↔ ${startupId} (warmed, score ${scored.score})`);
  } catch (e) {
    console.log(`  ✗ ${talentId} ↔ ${startupId} — ${(e as Error).message}`);
  }
}

async function main() {
  console.log('=== warming explanation cache ===');
  for (const id of TALENT_IDS) await warmTalent(id);
  for (const id of STARTUP_IDS) await warmStartup(id);
  console.log('\ndone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
