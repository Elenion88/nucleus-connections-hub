import { Hono } from 'hono';
import { db, schema } from '../db/index.ts';

export const networkRoutes = new Hono();

// Returns the full ecosystem graph: nodes (talent, startup, institution) and edges (connections).
networkRoutes.get('/graph', async (c) => {
  const talents = await db.select().from(schema.talent);
  const startups = await db.select().from(schema.startup);
  const conns = await db.select().from(schema.connection);

  const institutionIds = new Set<string>();
  for (const t of talents) t.affiliations.split('|').filter(Boolean).forEach((a) => institutionIds.add(a));
  for (const s of startups) s.utahRoots.split('|').filter(Boolean).forEach((a) => institutionIds.add(a));

  const nodes = [
    ...talents.map((t) => ({ id: t.id, kind: 'talent', label: t.name, sublabel: t.headline, sectors: t.sectors.split('|') })),
    ...startups.map((s) => ({ id: s.id, kind: 'startup', label: s.name, sublabel: s.oneliner, sector: s.sector })),
    ...[...institutionIds].map((id) => ({ id, kind: 'institution', label: humanInstitution(id) })),
  ];

  const edges: { from: string; to: string; kind: string; evidence?: string }[] = [];
  // Affiliation edges: derived from talent.affiliations / startup.utahRoots
  for (const t of talents) for (const a of t.affiliations.split('|').filter(Boolean)) edges.push({ from: t.id, to: a, kind: 'alumnus_of' });
  for (const s of startups) for (const a of s.utahRoots.split('|').filter(Boolean)) edges.push({ from: s.id, to: a, kind: 'origin' });
  // Explicit connection edges
  for (const c of conns) edges.push({ from: c.fromId, to: c.toId, kind: c.kind, evidence: c.evidence ?? undefined });

  return c.json({ nodes, edges });
});

// Find a path between a talent and a startup through the graph (BFS, max 3 hops).
networkRoutes.get('/path/:talentId/:startupId', async (c) => {
  const talentId = c.req.param('talentId');
  const startupId = c.req.param('startupId');
  const conns = await db.select().from(schema.connection);
  const talents = await db.select().from(schema.talent);
  const startups = await db.select().from(schema.startup);

  const adjacency = new Map<string, { to: string; kind: string; evidence?: string }[]>();
  const add = (a: string, b: string, kind: string, evidence?: string) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    adjacency.get(a)!.push({ to: b, kind, evidence });
  };
  for (const t of talents) for (const a of t.affiliations.split('|').filter(Boolean)) {
    add(t.id, a, 'alumnus_of'); add(a, t.id, 'has_alumnus');
  }
  for (const s of startups) for (const a of s.utahRoots.split('|').filter(Boolean)) {
    add(s.id, a, 'origin'); add(a, s.id, 'home_to');
  }
  for (const c of conns) { add(c.fromId, c.toId, c.kind, c.evidence ?? undefined); add(c.toId, c.fromId, c.kind, c.evidence ?? undefined); }

  // BFS
  const queue: { node: string; path: { node: string; kind?: string; evidence?: string }[] }[] = [
    { node: talentId, path: [{ node: talentId }] },
  ];
  const visited = new Set<string>([talentId]);
  while (queue.length) {
    const { node, path } = queue.shift()!;
    if (path.length > 4) continue;
    for (const edge of adjacency.get(node) ?? []) {
      if (visited.has(edge.to)) continue;
      const newPath = [...path, { node: edge.to, kind: edge.kind, evidence: edge.evidence }];
      if (edge.to === startupId) return c.json({ path: newPath });
      visited.add(edge.to);
      queue.push({ node: edge.to, path: newPath });
    }
  }
  return c.json({ path: null });
});

function humanInstitution(id: string) {
  const map: Record<string, string> = {
    u_of_u: 'University of Utah',
    byu: 'Brigham Young University',
    usu: 'Utah State University',
    silicon_slopes: 'Silicon Slopes',
    park_city: 'Park City',
    provo: 'Provo',
    recursion: 'Recursion',
    qualtrics: 'Qualtrics',
    domo: 'Domo',
    pluralsight: 'Pluralsight',
    sarcos: 'Sarcos',
  };
  return map[id] ?? id.replace(/_/g, ' ');
}
