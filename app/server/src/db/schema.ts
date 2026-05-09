import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Pipe-joined string columns are used wherever the brief calls for an array;
// SQLite has no native array, and pipe-joining keeps seed JSON inspection trivial.

export const talent = sqliteTable('talent', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),                 // "Ex-Recursion regulatory exec, FDA Class III"
  bio: text('bio').notNull(),
  location: text('location'),                            // "Salt Lake City, UT"
  email: text('email'),
  photoSeed: text('photo_seed'),                         // for deterministic avatar generation

  // Profile facets
  roleType: text('role_type').notNull(),                 // executive | cofounder | fractional | engineer | sales | marketing | student | advisor | mentor | board
  sectors: text('sectors').notNull(),                    // pipe: life_sciences|ai|defense|cyber|energy|advanced_manufacturing|fintech|software
  skills: text('skills').notNull(),                      // pipe-joined free-text + canonical
  functions: text('functions').notNull(),                // pipe: regulatory|sales|product|engineering|finance|operations|...
  availability: text('availability').notNull(),          // full_time | fractional | advisory | internship | mentor
  stagePreference: text('stage_preference').notNull(),   // pipe: idea|pre_seed|seed|series_a|growth
  riskTolerance: text('risk_tolerance').notNull(),       // low | medium | high
  compShape: text('comp_shape').notNull(),               // pipe: salary|equity|advisor_equity|hourly|free
  missionTags: text('mission_tags').notNull(),           // pipe: patient_outcomes|hard_tech|deep_science|sustainability|defense|productivity
  affiliations: text('affiliations').notNull(),          // pipe: u_of_u|byu|usu|recursion|qualtrics|domo|silicon_slopes|...
  yearsExperience: integer('years_experience').notNull(),

  // Embeddings stored as JSON arrays
  skillsEmbedding: text('skills_embedding'),
  missionEmbedding: text('mission_embedding'),
  experienceEmbedding: text('experience_embedding'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const startup = sqliteTable('startup', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  oneliner: text('oneliner').notNull(),                  // "Implantable neural interface that lets prosthetics feel touch"
  description: text('description').notNull(),
  location: text('location'),
  website: text('website'),
  logoSeed: text('logo_seed'),

  sector: text('sector').notNull(),                      // life_sciences | ai | defense | cyber | energy | advanced_manufacturing | fintech | software
  origin: text('origin').notNull(),                      // u_of_u_lab | byu_lab | usu_lab | bootstrapped | corporate_spinout
  trl: integer('trl'),                                   // 1..9
  fundingStage: text('funding_stage').notNull(),         // idea | pre_seed | seed | series_a | series_b | growth
  fundingRaisedUsd: integer('funding_raised_usd'),
  fundingSources: text('funding_sources'),               // pipe: nsf_sbir|nih|venture|grant|angel
  immediateNeeds: text('immediate_needs').notNull(),     // pipe: ceo|cto|coo|regulatory|biz_dev|sales|engineer|advisor
  missionTags: text('mission_tags').notNull(),
  utahRoots: text('utah_roots').notNull(),               // pipe: u_of_u|byu|usu|silicon_slopes|park_city|provo

  missionEmbedding: text('mission_embedding'),
  descriptionEmbedding: text('description_embedding'),
  needsEmbedding: text('needs_embedding'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const connection = sqliteTable('connection', {
  id: text('id').primaryKey(),
  fromKind: text('from_kind').notNull(),                 // talent | startup
  fromId: text('from_id').notNull(),
  toKind: text('to_kind').notNull(),                     // talent | startup | institution
  toId: text('to_id').notNull(),                         // for institutions: "u_of_u" etc.
  kind: text('kind').notNull(),                          // colleague | advisor_to | alumnus_of | investor_in | mentor_of | lab_collaborator
  evidence: text('evidence'),                             // free text
  strength: real('strength').default(1),                 // 0..1
});

export const matchCache = sqliteTable('match_cache', {
  id: text('id').primaryKey(),                           // hash(talentId|startupId)
  talentId: text('talent_id').notNull(),
  startupId: text('startup_id').notNull(),
  score: real('score').notNull(),                        // 0..100
  dimensions: text('dimensions').notNull(),              // JSON {skills, sector, stage, mission, network}
  whyBullets: text('why_bullets').notNull(),             // JSON string[]
  gaps: text('gaps').notNull(),                          // JSON string[]
  talkingPoints: text('talking_points').notNull(),       // JSON string[]
  generatedAt: integer('generated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const introRequest = sqliteTable('intro_request', {
  id: text('id').primaryKey(),
  talentId: text('talent_id').notNull(),
  startupId: text('startup_id').notNull(),
  requesterEmail: text('requester_email'),
  message: text('message'),
  status: text('status').notNull().default('pending'),   // pending | sent_to_nucleus | introduced | declined
  affinityNoteId: text('affinity_note_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Talent = typeof talent.$inferSelect;
export type NewTalent = typeof talent.$inferInsert;
export type Startup = typeof startup.$inferSelect;
export type NewStartup = typeof startup.$inferInsert;
export type Connection = typeof connection.$inferSelect;
export type MatchCache = typeof matchCache.$inferSelect;
