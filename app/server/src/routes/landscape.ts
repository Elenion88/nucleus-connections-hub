// Serve the pre-computed 2D PCA projection for the landscape view.
import { Hono } from 'hono';
import projection from '../seed/projection-2d.json' with { type: 'json' };

export const landscapeRoutes = new Hono();

landscapeRoutes.get('/', (c) => {
  return c.json({ points: projection });
});
