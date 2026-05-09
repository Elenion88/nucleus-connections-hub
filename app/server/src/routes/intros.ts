import { Hono } from 'hono';
import { db, schema } from '../db/index.ts';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const introRoutes = new Hono();

const Create = z.object({
  talentId: z.string(),
  startupId: z.string(),
  requesterEmail: z.string().email().optional(),
  message: z.string().optional(),
});

introRoutes.post('/', async (c) => {
  const body = Create.parse(await c.req.json());
  const id = nanoid(10);
  await db.insert(schema.introRequest).values({
    id,
    talentId: body.talentId,
    startupId: body.startupId,
    requesterEmail: body.requesterEmail,
    message: body.message,
    status: 'pending',
  });
  return c.json({ id, status: 'pending' });
});

introRoutes.get('/', async (c) => {
  const rows = await db.select().from(schema.introRequest).orderBy(desc(schema.introRequest.createdAt)).limit(100);
  return c.json(rows);
});

introRoutes.post('/:id/approve', async (c) => {
  const id = c.req.param('id');
  await db.update(schema.introRequest).set({ status: 'introduced' }).where(eq(schema.introRequest.id, id));
  return c.json({ ok: true });
});
