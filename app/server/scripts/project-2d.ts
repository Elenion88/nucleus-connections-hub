// Compute a 2D PCA projection of all talent and startup embeddings.
// Output a JSON file the API can serve; no need to add columns or recompute on the fly.
//
// PCA: subtract mean, compute covariance, find top-2 eigenvectors via simple power iteration,
// project. ~50 points × 1536 dims is trivial — no math libs needed.

import 'dotenv/config';
import { db, schema } from '../src/db/index.ts';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function vec(s: string | null | undefined): number[] | null {
  if (!s) return null;
  try { return JSON.parse(s) as number[]; } catch { return null; }
}

function mean(rows: number[][]): number[] {
  const d = rows[0].length;
  const m = new Array(d).fill(0);
  for (const r of rows) for (let i = 0; i < d; i++) m[i] += r[i];
  for (let i = 0; i < d; i++) m[i] /= rows.length;
  return m;
}

function subtractMean(rows: number[][], m: number[]): number[][] {
  return rows.map((r) => r.map((v, i) => v - m[i]));
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

function normalize(a: number[]): number[] {
  const n = norm(a) || 1;
  return a.map((v) => v / n);
}

// Power iteration: find the top eigenvector of the covariance C = X^T X / n
// We don't materialize C (1536x1536); instead compute (X^T X) v = X^T (X v)
function topEigenvector(X: number[][], iterations = 80): number[] {
  const d = X[0].length;
  let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
  v = normalize(v);
  for (let it = 0; it < iterations; it++) {
    // Xv = each row dotted with v -> N-vector
    const Xv = X.map((row) => dot(row, v));
    // X^T (Xv) = sum over rows of row * Xv[i] -> d-vector
    const Atv = new Array(d).fill(0);
    for (let i = 0; i < X.length; i++) {
      const w = Xv[i];
      const row = X[i];
      for (let j = 0; j < d; j++) Atv[j] += row[j] * w;
    }
    v = normalize(Atv);
  }
  return v;
}

function deflate(X: number[][], v: number[]): number[][] {
  // Project each row onto v and subtract: row' = row - (row · v) v
  return X.map((row) => {
    const c = dot(row, v);
    return row.map((x, i) => x - c * v[i]);
  });
}

interface Item { id: string; kind: 'talent' | 'startup'; label: string; sector: string; embedding: number[] }

async function main() {
  const talent = await db.select().from(schema.talent);
  const startups = await db.select().from(schema.startup);

  const items: Item[] = [];

  // For talent we use the skills embedding (it's the most "matchable" facet).
  for (const t of talent) {
    const e = vec(t.skillsEmbedding);
    if (!e) continue;
    items.push({
      id: t.id, kind: 'talent', label: t.name,
      sector: (t.sectors.split('|')[0] ?? 'unknown'),
      embedding: e,
    });
  }
  // For startups we use the needs embedding.
  for (const s of startups) {
    const e = vec(s.needsEmbedding);
    if (!e) continue;
    items.push({
      id: s.id, kind: 'startup', label: s.name,
      sector: s.sector,
      embedding: e,
    });
  }

  console.log(`projecting ${items.length} items (${talent.length} talent + ${startups.length} startups)`);

  const X = items.map((it) => it.embedding);
  const m = mean(X);
  const Xc = subtractMean(X, m);

  console.log('finding PC1…');
  const pc1 = topEigenvector(Xc);
  const Xd = deflate(Xc, pc1);
  console.log('finding PC2…');
  const pc2 = topEigenvector(Xd);

  const projected = items.map((it, i) => ({
    id: it.id,
    kind: it.kind,
    label: it.label,
    sector: it.sector,
    x: dot(Xc[i], pc1),
    y: dot(Xc[i], pc2),
  }));

  // Normalize coords to [-1, 1] for easy frontend rendering
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const xMax = Math.max(...xs.map(Math.abs));
  const yMax = Math.max(...ys.map(Math.abs));
  for (const p of projected) {
    p.x = p.x / (xMax || 1);
    p.y = p.y / (yMax || 1);
  }

  const outPath = path.resolve(__dirname, '../src/seed/projection-2d.json');
  writeFileSync(outPath, JSON.stringify(projected, null, 2));
  console.log(`wrote ${projected.length} projected points to ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
