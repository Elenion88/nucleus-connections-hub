// Lightweight: rebuild schema from drizzle definitions using SQLite DDL emitted at runtime.
// For a 24h hackathon we skip drizzle-kit migrations and just CREATE TABLE IF NOT EXISTS.
import 'dotenv/config';
import { sqlite } from './db/index.ts';

const ddl = `
CREATE TABLE IF NOT EXISTS talent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  bio TEXT NOT NULL,
  location TEXT,
  email TEXT,
  photo_seed TEXT,
  role_type TEXT NOT NULL,
  sectors TEXT NOT NULL,
  skills TEXT NOT NULL,
  functions TEXT NOT NULL,
  availability TEXT NOT NULL,
  stage_preference TEXT NOT NULL,
  risk_tolerance TEXT NOT NULL,
  comp_shape TEXT NOT NULL,
  mission_tags TEXT NOT NULL,
  affiliations TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  skills_embedding TEXT,
  mission_embedding TEXT,
  experience_embedding TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS startup (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  oneliner TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  website TEXT,
  logo_seed TEXT,
  sector TEXT NOT NULL,
  origin TEXT NOT NULL,
  trl INTEGER,
  funding_stage TEXT NOT NULL,
  funding_raised_usd INTEGER,
  funding_sources TEXT,
  immediate_needs TEXT NOT NULL,
  mission_tags TEXT NOT NULL,
  utah_roots TEXT NOT NULL,
  mission_embedding TEXT,
  description_embedding TEXT,
  needs_embedding TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS connection (
  id TEXT PRIMARY KEY,
  from_kind TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_kind TEXT NOT NULL,
  to_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  evidence TEXT,
  strength REAL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS match_cache (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  startup_id TEXT NOT NULL,
  score REAL NOT NULL,
  dimensions TEXT NOT NULL,
  why_bullets TEXT NOT NULL,
  gaps TEXT NOT NULL,
  talking_points TEXT NOT NULL,
  generated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_match_cache_talent ON match_cache(talent_id);
CREATE INDEX IF NOT EXISTS idx_match_cache_startup ON match_cache(startup_id);

CREATE TABLE IF NOT EXISTS intro_request (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  startup_id TEXT NOT NULL,
  requester_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  affinity_note_id TEXT,
  created_at INTEGER
);
`;

sqlite.exec(ddl);
console.log('migrated');
