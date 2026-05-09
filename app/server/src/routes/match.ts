import { Hono } from 'hono';
import { topMatchesForTalent, topMatchesForStartup, getCachedExplanation, saveExplanation, explainMatch } from '../lib/match.ts';
import { db, schema } from '../db/index.ts';
import { eq } from 'drizzle-orm';

export const matchRoutes = new Hono();

matchRoutes.get('/talent/:id', async (c) => {
  const id = c.req.param('id');
  const k = Number(c.req.query('k') ?? 5);
  const top = await topMatchesForTalent(id, k);
  return c.json({
    direction: 'talent_to_startup',
    talentId: id,
    matches: top.map((m) => ({
      startup: stripStartupVecs(m.startup),
      score: m.score,
      dimensions: m.dimensions,
      hardFilterReasons: m.hardFilterReasons,
      rank: m.rank,
      total: m.total,
    })),
  });
});

matchRoutes.get('/startup/:id', async (c) => {
  const id = c.req.param('id');
  const k = Number(c.req.query('k') ?? 5);
  const top = await topMatchesForStartup(id, k);
  return c.json({
    direction: 'startup_to_talent',
    startupId: id,
    matches: top.map((m) => ({
      talent: stripTalentVecs(m.talent),
      score: m.score,
      dimensions: m.dimensions,
      hardFilterReasons: m.hardFilterReasons,
      rank: m.rank,
      total: m.total,
    })),
  });
});

// Detail: explanation comes from cache, or LLM call (then cached).
matchRoutes.get('/explain/:talentId/:startupId', async (c) => {
  const talentId = c.req.param('talentId');
  const startupId = c.req.param('startupId');

  const cached = getCachedExplanation(talentId, startupId);
  const [t] = await db.select().from(schema.talent).where(eq(schema.talent.id, talentId));
  const [s] = await db.select().from(schema.startup).where(eq(schema.startup.id, startupId));
  if (!t || !s) return c.json({ error: 'not found' }, 404);

  if (cached) {
    return c.json({
      cached: true,
      score: cached.score,
      dimensions: cached.dimensions,
      whyBullets: cached.whyBullets,
      gaps: cached.gaps,
      talkingPoints: cached.talkingPoints,
      headline: cached.headline,
      talent: stripTalentVecs(t),
      startup: stripStartupVecs(s),
    });
  }

  const { rawScore } = await import('../lib/match.ts');
  const scored = rawScore(t, s);
  const explained = await explainMatch(t, s, scored);
  saveExplanation(
    talentId, startupId, scored.score, scored.dimensions,
    explained.whyBullets, explained.gaps, explained.talkingPoints, explained.headline
  );
  return c.json({
    cached: false,
    score: scored.score,
    dimensions: scored.dimensions,
    whyBullets: explained.whyBullets,
    gaps: explained.gaps,
    talkingPoints: explained.talkingPoints,
    headline: explained.headline,
    talent: stripTalentVecs(t),
    startup: stripStartupVecs(s),
  });
});

function stripTalentVecs(t: any) {
  const { skillsEmbedding, missionEmbedding, experienceEmbedding, ...rest } = t;
  return rest;
}
function stripStartupVecs(s: any) {
  const { missionEmbedding, descriptionEmbedding, needsEmbedding, ...rest } = s;
  return rest;
}
