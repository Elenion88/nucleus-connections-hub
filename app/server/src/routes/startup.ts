import { Hono } from 'hono';
import { db, schema } from '../db/index.ts';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { embed } from '../lib/llm.ts';
import { embeddingTextsForStartup } from '../lib/profile-text.ts';

export const startupRoutes = new Hono();

startupRoutes.get('/', async (c) => {
  const rows = await db.select().from(schema.startup).orderBy(desc(schema.startup.createdAt)).limit(200);
  return c.json(rows.map(stripEmbeddings));
});

startupRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select().from(schema.startup).where(eq(schema.startup.id, id));
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(stripEmbeddings(row));
});

const CreateStartup = z.object({
  name: z.string(),
  oneliner: z.string(),
  description: z.string(),
  location: z.string().optional(),
  website: z.string().optional(),
  sector: z.string(),
  origin: z.string(),
  trl: z.number().optional(),
  fundingStage: z.string(),
  fundingRaisedUsd: z.number().optional(),
  fundingSources: z.array(z.string()).default([]),
  immediateNeeds: z.array(z.string()),
  missionTags: z.array(z.string()),
  utahRoots: z.array(z.string()),
});

startupRoutes.post('/', async (c) => {
  const body = CreateStartup.parse(await c.req.json());
  const id = nanoid(10);
  const row = {
    id,
    name: body.name,
    oneliner: body.oneliner,
    description: body.description,
    location: body.location,
    website: body.website,
    logoSeed: id,
    sector: body.sector,
    origin: body.origin,
    trl: body.trl,
    fundingStage: body.fundingStage,
    fundingRaisedUsd: body.fundingRaisedUsd,
    fundingSources: body.fundingSources.join('|'),
    immediateNeeds: body.immediateNeeds.join('|'),
    missionTags: body.missionTags.join('|'),
    utahRoots: body.utahRoots.join('|'),
  };
  await db.insert(schema.startup).values(row);

  const texts = embeddingTextsForStartup(row as any);
  const [missionVec, descVec, needsVec] = await embed([texts.mission, texts.description, texts.needs]);
  await db
    .update(schema.startup)
    .set({
      missionEmbedding: JSON.stringify(missionVec),
      descriptionEmbedding: JSON.stringify(descVec),
      needsEmbedding: JSON.stringify(needsVec),
    })
    .where(eq(schema.startup.id, id));

  return c.json({ id });
});

function stripEmbeddings<T extends Record<string, unknown>>(row: T) {
  const { missionEmbedding, descriptionEmbedding, needsEmbedding, ...rest } = row as any;
  return rest;
}
