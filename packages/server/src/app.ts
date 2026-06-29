// CONTRACT:S1-API.1.0
// Builds the Nostimos Fastify application: wires CORS, the data store, and all
// route modules. Exported separately from the process entrypoint so tests can
// build an app against an in-memory store without binding a port.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { Store } from './db.js';
import { registerRecipeRoutes } from './routes/recipes.js';
import { registerDishRoutes } from './routes/dishes.js';
import { registerMenuRoutes } from './routes/menus.js';
import { registerTaxonomyRoutes } from './routes/taxonomy.js';
import { registerPlanRoutes } from './routes/plan.js';
import { UPLOADS_PREFIX } from './routes/images.js';

/** Max accepted upload size; the client compresses well below this. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface BuildOptions {
  /** SQLite path; ':memory:' (default) for ephemeral / test instances. */
  dbPath?: string;
  store?: Store;
  logger?: boolean;
  /** Directory for uploaded cover images. Defaults to ./data/uploads. */
  uploadsDir?: string;
}

export function buildApp(opts: BuildOptions = {}): FastifyInstance {
  const store = opts.store ?? new Store(opts.dbPath ?? ':memory:');
  const uploadsDir = resolve(opts.uploadsDir ?? 'data/uploads');
  mkdirSync(uploadsDir, { recursive: true });
  const app = Fastify({ logger: opts.logger ?? false });

  app.register(cors, { origin: true });
  app.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 }, throwFileSizeLimit: false });
  app.register(fastifyStatic, { root: uploadsDir, prefix: UPLOADS_PREFIX, decorateReply: false });

  app.get('/api/health', async () => ({ status: 'ok', service: 'nostimos' }));

  registerRecipeRoutes(app, store, uploadsDir);
  registerDishRoutes(app, store, uploadsDir);
  registerMenuRoutes(app, store);
  registerTaxonomyRoutes(app, store);
  registerPlanRoutes(app, store);

  app.addHook('onClose', async () => {
    if (!opts.store) store.close();
  });

  return app;
}
