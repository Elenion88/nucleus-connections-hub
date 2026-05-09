// Load curated seed JSON into SQLite. Idempotent (REPLACE on PK conflict).
import 'dotenv/config';
import { sqlite } from '../src/db/index.ts';
import { seedTalent } from '../src/seed/talent.ts';
import { seedStartups } from '../src/seed/startups.ts';
import { seedConnections } from '../src/seed/connections.ts';

const insertTalent = sqlite.prepare(`
INSERT OR REPLACE INTO talent
(id, name, headline, bio, location, email, photo_seed, role_type, sectors, skills, functions,
 availability, stage_preference, risk_tolerance, comp_shape, mission_tags, affiliations,
 years_experience, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertStartup = sqlite.prepare(`
INSERT OR REPLACE INTO startup
(id, name, oneliner, description, location, website, logo_seed, sector, origin, trl,
 funding_stage, funding_raised_usd, funding_sources, immediate_needs, mission_tags, utah_roots, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertConnection = sqlite.prepare(`
INSERT OR REPLACE INTO connection
(id, from_kind, from_id, to_kind, to_id, kind, evidence, strength)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = Math.floor(Date.now() / 1000);

const tx = sqlite.transaction(() => {
  for (const t of seedTalent) {
    insertTalent.run(
      t.id, t.name, t.headline, t.bio, t.location, t.email, t.id,
      t.roleType, t.sectors.join('|'), t.skills.join('|'), t.functions.join('|'),
      t.availability, t.stagePreference.join('|'), t.riskTolerance, t.compShape.join('|'),
      t.missionTags.join('|'), t.affiliations.join('|'), t.yearsExperience, now
    );
  }
  for (const s of seedStartups) {
    insertStartup.run(
      s.id, s.name, s.oneliner, s.description, s.location, s.website, s.id,
      s.sector, s.origin, s.trl, s.fundingStage, s.fundingRaisedUsd,
      s.fundingSources.join('|'), s.immediateNeeds.join('|'),
      s.missionTags.join('|'), s.utahRoots.join('|'), now
    );
  }
  for (const c of seedConnections) {
    insertConnection.run(c.id, c.fromKind, c.fromId, c.toKind, c.toId, c.kind, c.evidence ?? null, c.strength ?? 1);
  }
});

tx();

const tCount = (sqlite.prepare('SELECT count(*) as n FROM talent').get() as { n: number }).n;
const sCount = (sqlite.prepare('SELECT count(*) as n FROM startup').get() as { n: number }).n;
const cCount = (sqlite.prepare('SELECT count(*) as n FROM connection').get() as { n: number }).n;
console.log(`seeded: ${tCount} talent, ${sCount} startups, ${cCount} connections`);
