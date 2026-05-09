import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { health } from './routes/health.ts';
import { talentRoutes } from './routes/talent.ts';
import { startupRoutes } from './routes/startup.ts';
import { matchRoutes } from './routes/match.ts';
import { networkRoutes } from './routes/network.ts';
import { introRoutes } from './routes/intros.ts';
import { affinityRoutes } from './routes/affinity.ts';
import { extractRoutes } from './routes/extract.ts';
import { landscapeRoutes } from './routes/landscape.ts';

const app = new Hono();

app.use('*', cors());

app.route('/api', health);
app.route('/api/talent', talentRoutes);
app.route('/api/startup', startupRoutes);
app.route('/api/match', matchRoutes);
app.route('/api/network', networkRoutes);
app.route('/api/intros', introRoutes);
app.route('/api/affinity', affinityRoutes);
app.route('/api/extract', extractRoutes);
app.route('/api/landscape', landscapeRoutes);

// In production, the web app's `dist/` is served from the same port. WEB_DIST
// can override the path; default looks for ../web/dist relative to this server
// (matches the repo layout).
const webDist = resolve(process.env.WEB_DIST || '../web/dist');
if (existsSync(webDist)) {
  app.use('/*', serveStatic({ root: webDist }));
  // SPA fallback: unmatched non-API GETs return index.html so client-side
  // routes (/story, /talent/:id, etc.) work on hard refresh. /api/* still 404s.
  const indexHtml = readFileSync(join(webDist, 'index.html'), 'utf8');
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.notFound();
    return c.html(indexHtml);
  });
  console.log(`serving static web bundle from ${webDist}`);
} else {
  console.log(`(no web bundle at ${webDist} — running API only)`);
}

const port = Number(process.env.PORT || 4007);
serve({ fetch: app.fetch, port });
console.log(`nucleus server listening on :${port}`);
