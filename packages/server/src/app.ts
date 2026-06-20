// CONTRACT:S1-API.1.0
// Builds the Nostimos Fastify application: wires CORS, the data store, and all
// route modules. Exported separately from the process entrypoint so tests can
// build an app against an in-memory store without binding a port.
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Store } from './db.js';
import { registerRecipeRoutes } from './routes/recipes.js';
import { registerDishRoutes } from './routes/dishes.js';
import { registerMenuRoutes } from './routes/menus.js';
import { registerTaxonomyRoutes } from './routes/taxonomy.js';
import { registerPlanRoutes } from './routes/plan.js';

export interface BuildOptions {
  /** SQLite path; ':memory:' (default) for ephemeral / test instances. */
  dbPath?: string;
  store?: Store;
  logger?: boolean;
}

export function buildApp(opts: BuildOptions = {}): FastifyInstance {
  const store = opts.store ?? new Store(opts.dbPath ?? ':memory:');
  const app = Fastify({ logger: opts.logger ?? false });

  app.register(cors, { origin: true });

  app.get('/api/health', async () => ({ status: 'ok', service: 'nostimos' }));

  registerRecipeRoutes(app, store);
  registerDishRoutes(app, store);
  registerMenuRoutes(app, store);
  registerTaxonomyRoutes(app, store);
  registerPlanRoutes(app, store);

  app.addHook('onClose', async () => {
    if (!opts.store) store.close();
  });

  return app;
}
