import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
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

const port = Number(process.env.PORT || 4007);
serve({ fetch: app.fetch, port });
console.log(`nucleus server listening on :${port}`);
