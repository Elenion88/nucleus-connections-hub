// Compute embeddings for every talent + startup row. Idempotent — skips rows that already have embeddings.
import 'dotenv/config';
import { db, schema, sqlite } from '../src/db/index.ts';
import { embed } from '../src/lib/llm.ts';
import { embeddingTextsForTalent, embeddingTextsForStartup } from '../src/lib/profile-text.ts';
import type { Talent, Startup } from '../src/db/schema.ts';

async function embedTalent(force = false) {
  const rows = await db.select().from(schema.talent);
  const targets = force ? rows : rows.filter((r) => !r.skillsEmbedding || !r.missionEmbedding || !r.experienceEmbedding);
  if (targets.length === 0) { console.log('talent: all embeddings already present'); return; }
  const inputs: { id: string; texts: ReturnType<typeof embeddingTextsForTalent> }[] = targets.map((t) => ({ id: t.id, texts: embeddingTextsForTalent(t as Talent) }));

  // Batch all 3 slots × N rows in one call to amortize latency
  const flat = inputs.flatMap((i) => [i.texts.skills, i.texts.mission, i.texts.experience]);
  const vecs = await embed(flat);
  const upd = sqlite.prepare('UPDATE talent SET skills_embedding=?, mission_embedding=?, experience_embedding=? WHERE id=?');
  const tx = sqlite.transaction(() => {
    inputs.forEach((i, idx) => {
      const [s, m, e] = [vecs[idx * 3], vecs[idx * 3 + 1], vecs[idx * 3 + 2]];
      upd.run(JSON.stringify(s), JSON.stringify(m), JSON.stringify(e), i.id);
    });
  });
  tx();
  console.log(`talent: embedded ${inputs.length}`);
}

async function embedStartups(force = false) {
  const rows = await db.select().from(schema.startup);
  const targets = force ? rows : rows.filter((r) => !r.missionEmbedding || !r.descriptionEmbedding || !r.needsEmbedding);
  if (targets.length === 0) { console.log('startup: all embeddings already present'); return; }
  const inputs = targets.map((s) => ({ id: s.id, texts: embeddingTextsForStartup(s as Startup) }));
  const flat = inputs.flatMap((i) => [i.texts.mission, i.texts.description, i.texts.needs]);
  const vecs = await embed(flat);
  const upd = sqlite.prepare('UPDATE startup SET mission_embedding=?, description_embedding=?, needs_embedding=? WHERE id=?');
  const tx = sqlite.transaction(() => {
    inputs.forEach((i, idx) => {
      upd.run(JSON.stringify(vecs[idx * 3]), JSON.stringify(vecs[idx * 3 + 1]), JSON.stringify(vecs[idx * 3 + 2]), i.id);
    });
  });
  tx();
  console.log(`startup: embedded ${inputs.length}`);
}

const force = process.argv.includes('--force');
await embedTalent(force);
await embedStartups(force);
console.log('done');
