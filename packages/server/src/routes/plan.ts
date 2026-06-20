// CONTRACT:S1-API.1.0
// Meal-plan endpoints: list a date range, then create / update / delete entries.
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { MealPlanEntryCreate, MealPlanEntryUpdate, calendarDate } from '@nostimos/shared';
import type { Store } from '../db.js';
import { parseBody, notFound } from './http.js';

const RangeQuery = z.object({ from: calendarDate.optional(), to: calendarDate.optional() });

export function registerPlanRoutes(app: FastifyInstance, store: Store): void {
  app.get('/api/plan', async (req, reply) => {
    const q = parseBody(RangeQuery, req.query, reply);
    if (!q) return;
    return store.listEntries(q.from, q.to);
  });

  app.post('/api/plan', async (req, reply) => {
    const input = parseBody(MealPlanEntryCreate, req.body, reply);
    if (!input) return;
    if ((input.dishId === null) === (input.menuId === null)) {
      reply.code(400);
      return { error: 'a plan entry must reference exactly one of dishId or menuId' };
    }
    reply.code(201);
    return store.createEntry(input);
  });

  app.put('/api/plan/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = parseBody(MealPlanEntryUpdate, req.body, reply);
    if (!patch) return;
    return store.updateEntry(id, patch) ?? notFound(reply, 'plan entry');
  });

  app.delete('/api/plan/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!store.deleteEntry(id)) return notFound(reply, 'plan entry');
    reply.code(204);
    return null;
  });
}
