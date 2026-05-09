// Thin fetch wrapper. /api is proxied to the Hono server in dev (vite.config.ts).

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export interface Talent {
  id: string; name: string; headline: string; bio: string; location?: string; email?: string;
  photoSeed?: string;
  roleType: string; sectors: string; skills: string; functions: string;
  availability: string; stagePreference: string; riskTolerance: string;
  compShape: string; missionTags: string; affiliations: string;
  yearsExperience: number;
}

export interface Startup {
  id: string; name: string; oneliner: string; description: string;
  location?: string; website?: string; logoSeed?: string;
  sector: string; origin: string; trl?: number;
  fundingStage: string; fundingRaisedUsd?: number; fundingSources?: string;
  immediateNeeds: string; missionTags: string; utahRoots: string;
}

export interface MatchDimensions { skills: number; sector: number; stage: number; mission: number; network: number; }

export interface MatchSuggestion {
  title: string;
  body: string;
  dimension: string;   // skills | sector | stage | mission | network
  points: number;      // estimated +pts on composite
}

export interface MatchExplain {
  cached: boolean;
  score: number;
  dimensions: MatchDimensions;
  whyBullets: string[];
  gaps: string[];
  talkingPoints: string[];
  headline?: string;
  suggestions?: MatchSuggestion[];
  outreachDraft?: string;
  talent?: Talent;
  startup?: Startup;
}

export const api = {
  health: () => http<{ ok: boolean; talent: number; startup: number; cachedMatches: number; provider: string }>('/health'),
  talentList: () => http<Talent[]>('/talent'),
  startupList: () => http<Startup[]>('/startup'),
  talent: (id: string) => http<Talent>(`/talent/${id}`),
  startup: (id: string) => http<Startup>(`/startup/${id}`),
  createTalent: (body: unknown) => http<{ id: string }>(`/talent`, { method: 'POST', body: JSON.stringify(body) }),
  createStartup: (body: unknown) => http<{ id: string }>(`/startup`, { method: 'POST', body: JSON.stringify(body) }),
  matchesForTalent: (id: string, k = 5) => http<{ direction: 'talent_to_startup'; talentId: string; matches: { startup: Startup; score: number; dimensions: MatchDimensions; hardFilterReasons: string[]; rank: number; total: number }[] }>(`/match/talent/${id}?k=${k}`),
  matchesForStartup: (id: string, k = 5) => http<{ direction: 'startup_to_talent'; startupId: string; matches: { talent: Talent; score: number; dimensions: MatchDimensions; hardFilterReasons: string[]; rank: number; total: number }[] }>(`/match/startup/${id}?k=${k}`),
  explain: (talentId: string, startupId: string) => http<MatchExplain>(`/match/explain/${talentId}/${startupId}`),
  graph: () => http<{ nodes: { id: string; kind: string; label: string; sublabel?: string; sectors?: string[]; sector?: string }[]; edges: { from: string; to: string; kind: string; evidence?: string }[] }>(`/network/graph`),
  pathBetween: (talentId: string, startupId: string) => http<{ path: { node: string; kind?: string; evidence?: string }[] | null }>(`/network/path/${talentId}/${startupId}`),
  affinityStatus: () => http<{ connected: boolean; mode: string }>(`/affinity/status`),
  affinityPushPreview: (talentId: string, startupId: string, summary: string) =>
    http<{ mode: string; requests?: unknown[]; results?: unknown[] }>(`/affinity/push-match`, { method: 'POST', body: JSON.stringify({ talentId, startupId, summary }) }),
  createIntro: (talentId: string, startupId: string, message?: string) =>
    http<{ id: string; status: string }>(`/intros`, { method: 'POST', body: JSON.stringify({ talentId, startupId, message }) }),
  intros: () => http<{ id: string; talentId: string; startupId: string; status: string; message?: string; createdAt: number }[]>(`/intros`),
  approveIntro: (id: string) => http<{ ok: boolean; status: string }>(`/intros/${id}/approve`, { method: 'POST', body: '{}' }),
  declineIntro: (id: string) => http<{ ok: boolean; status: string }>(`/intros/${id}/decline`, { method: 'POST', body: '{}' }),
  extractTalent: (text: string) => http<{
    name?: string; headline?: string; bio?: string; location?: string; email?: string;
    roleType?: string; sectors: string[]; skills: string[]; functions: string[];
    availability?: string; stagePreference: string[]; riskTolerance?: string;
    compShape: string[]; missionTags: string[]; affiliations: string[]; yearsExperience: number;
  }>(`/extract/talent`, { method: 'POST', body: JSON.stringify({ text }) }),
  landscape: () => http<{ points: { id: string; kind: 'talent' | 'startup'; label: string; sector: string; x: number; y: number }[] }>(`/landscape`),
  extractStartup: (text: string) => http<{
    name?: string; oneliner?: string; description?: string; location?: string; website?: string;
    sector?: string; origin?: string; trl?: number; fundingStage?: string; fundingRaisedUsd?: number;
    fundingSources: string[]; immediateNeeds: string[]; missionTags: string[]; utahRoots: string[];
  }>(`/extract/startup`, { method: 'POST', body: JSON.stringify({ text }) }),
};

export function pipe(s: string | undefined | null): string[] {
  if (!s) return [];
  return s.split('|').filter(Boolean);
}

export function pretty(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
