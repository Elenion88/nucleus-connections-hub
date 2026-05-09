import 'dotenv/config';
import { topMatchesForTalent, topMatchesForStartup, explainMatch, rawScore } from '../src/lib/match.ts';
import { db, schema } from '../src/db/index.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const top = await topMatchesForTalent('t_sarah_chen', 5);
  console.log('=== Sarah Chen → top startups ===');
  top.forEach((m, i) => {
    console.log(`${i + 1}. ${m.startup.name.padEnd(28)} score=${m.score}  skills=${m.dimensions.skills} sector=${m.dimensions.sector} stage=${m.dimensions.stage} mission=${m.dimensions.mission} network=${m.dimensions.network}`);
  });

  const t2 = await topMatchesForStartup('st_neurotouch', 5);
  console.log('\n=== NeuroTouch → top talent ===');
  t2.forEach((m, i) => {
    console.log(`${i + 1}. ${m.talent.name.padEnd(24)} ${m.talent.roleType.padEnd(12)} score=${m.score}`);
  });

  const t3 = await topMatchesForStartup('st_silicell', 5);
  console.log('\n=== SiliCell → top talent ===');
  t3.forEach((m, i) => {
    console.log(`${i + 1}. ${m.talent.name.padEnd(24)} ${m.talent.roleType.padEnd(12)} score=${m.score}`);
  });

  const t4 = await topMatchesForStartup('st_sentry', 5);
  console.log('\n=== Sentry SaaS (growth stage) → top talent ===');
  t4.forEach((m, i) => {
    console.log(`${i + 1}. ${m.talent.name.padEnd(24)} ${m.talent.roleType.padEnd(12)} score=${m.score}`);
  });

  const t5 = await topMatchesForStartup('st_terraform', 3);
  console.log('\n=== TerraForm Ag (student/intern angle) → top talent ===');
  t5.forEach((m, i) => {
    console.log(`${i + 1}. ${m.talent.name.padEnd(24)} ${m.talent.roleType.padEnd(12)} score=${m.score}`);
  });

  // Run one LLM explanation to confirm the prompt path works
  const [sarah] = await db.select().from(schema.talent).where(eq(schema.talent.id, 't_sarah_chen'));
  const [neurotouch] = await db.select().from(schema.startup).where(eq(schema.startup.id, 'st_neurotouch'));
  const scored = rawScore(sarah, neurotouch);
  const explained = await explainMatch(sarah, neurotouch, scored);
  console.log('\n=== LLM explanation: Sarah → NeuroTouch ===');
  console.log('WHY:', explained.whyBullets);
  console.log('GAPS:', explained.gaps);
  console.log('TALKING POINTS:', explained.talkingPoints);
}

main().catch((e) => { console.error(e); process.exit(1); });
