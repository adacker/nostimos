// CONTRACT:S1-API.1.0
// Taxonomy endpoints: dish labels (Italian, Tex-Mex…), dish categories
// (tacos, pasta…), and persistent weekday labels (Taco Tuesday).
import type { FastifyInstance } from 'fastify';
import { DishLabelCreate, DishCategoryCreate, DayLabelCreate } from '@nostimos/shared';
import type { Store } from '../db.js';
import { parseBody, notFound } from './http.js';

export function registerTaxonomyRoutes(app: FastifyInstance, store: Store): void {
  // ── Labels ──
  app.get('/api/labels', async () => store.listLabels());
  app.post('/api/labels', async (req, reply) => {
    const input = parseBody(DishLabelCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createLabel(input);
  });
  app.delete('/api/labels/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!store.deleteLabel(id)) return notFound(reply, 'label');
    reply.code(204);
    return null;
  });

  // ── Categories ──
  app.get('/api/categories', async () => store.listCategories());
  app.post('/api/categories', async (req, reply) => {
    const input = parseBody(DishCategoryCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createCategory(input);
  });
  app.delete('/api/categories/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!store.deleteCategory(id)) return notFound(reply, 'category');
    reply.code(204);
    return null;
  });

  // ── Day labels ──
  app.get('/api/day-labels', async () => store.listDayLabels());
  app.post('/api/day-labels', async (req, reply) => {
    const input = parseBody(DayLabelCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createDayLabel(input);
  });
  app.delete('/api/day-labels/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!store.deleteDayLabel(id)) return notFound(reply, 'day label');
    reply.code(204);
    return null;
  });
}
