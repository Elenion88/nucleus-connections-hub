import { Hono } from 'hono';
import { sqlite } from '../db/index.ts';

export const health = new Hono();

health.get('/health', (c) => {
  const talentCount = (sqlite.prepare('SELECT count(*) as n FROM talent').get() as { n: number }).n;
  const startupCount = (sqlite.prepare('SELECT count(*) as n FROM startup').get() as { n: number }).n;
  const matchCount = (sqlite.prepare('SELECT count(*) as n FROM match_cache').get() as { n: number }).n;
  return c.json({
    ok: true,
    talent: talentCount,
    startup: startupCount,
    cachedMatches: matchCount,
    provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : process.env.OPENAI_API_KEY ? 'openai' : 'none',
  });
});
