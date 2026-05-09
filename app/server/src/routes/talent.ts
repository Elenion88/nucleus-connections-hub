import { Hono } from 'hono';
import { db, schema } from '../db/index.ts';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { embed } from '../lib/llm.ts';
import { embeddingTextsForTalent } from '../lib/profile-text.ts';

export const talentRoutes = new Hono();

talentRoutes.get('/', async (c) => {
  const rows = await db.select().from(schema.talent).orderBy(desc(schema.talent.createdAt)).limit(200);
  return c.json(rows.map(stripEmbeddings));
});

talentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select().from(schema.talent).where(eq(schema.talent.id, id));
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(stripEmbeddings(row));
});

const CreateTalent = z.object({
  name: z.string(),
  headline: z.string(),
  bio: z.string(),
  email: z.string().optional(),
  location: z.string().optional(),
  roleType: z.string(),
  sectors: z.array(z.string()),
  skills: z.array(z.string()),
  functions: z.array(z.string()),
  availability: z.string(),
  stagePreference: z.array(z.string()),
  riskTolerance: z.string(),
  compShape: z.array(z.string()),
  missionTags: z.array(z.string()),
  affiliations: z.array(z.string()),
  yearsExperience: z.number(),
});

talentRoutes.post('/', async (c) => {
  const body = CreateTalent.parse(await c.req.json());
  const id = nanoid(10);
  const row = {
    id,
    name: body.name,
    headline: body.headline,
    bio: body.bio,
    email: body.email,
    location: body.location,
    photoSeed: id,
    roleType: body.roleType,
    sectors: body.sectors.join('|'),
    skills: body.skills.join('|'),
    functions: body.functions.join('|'),
    availability: body.availability,
    stagePreference: body.stagePreference.join('|'),
    riskTolerance: body.riskTolerance,
    compShape: body.compShape.join('|'),
    missionTags: body.missionTags.join('|'),
    affiliations: body.affiliations.join('|'),
    yearsExperience: body.yearsExperience,
  };
  await db.insert(schema.talent).values(row);

  // Embed inline so the matcher can run immediately on the new profile.
  const texts = embeddingTextsForTalent(row as any);
  const [skillsVec, missionVec, expVec] = await embed([texts.skills, texts.mission, texts.experience]);
  await db
    .update(schema.talent)
    .set({
      skillsEmbedding: JSON.stringify(skillsVec),
      missionEmbedding: JSON.stringify(missionVec),
      experienceEmbedding: JSON.stringify(expVec),
    })
    .where(eq(schema.talent.id, id));

  return c.json({ id });
});

function stripEmbeddings<T extends Record<string, unknown>>(row: T) {
  const { skillsEmbedding, missionEmbedding, experienceEmbedding, ...rest } = row as any;
  return rest;
}
