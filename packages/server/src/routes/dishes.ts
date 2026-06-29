// CONTRACT:S1-API.1.0
// Dish endpoints: CRUD. A dish carries label/recipe associations and an
// optional category.
import type { FastifyInstance } from 'fastify';
import { DishCreate, DishUpdate } from '@nostimos/shared';
import type { Store } from '../db.js';
import { parseBody, notFound } from './http.js';
import { registerImageRoutes, removeImageFile } from './images.js';

export function registerDishRoutes(app: FastifyInstance, store: Store, uploadsDir: string): void {
  app.get('/api/dishes', async () => store.listDishes());

  app.post('/api/dishes', async (req, reply) => {
    const input = parseBody(DishCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createDish(input);
  });

  app.get('/api/dishes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    return store.getDish(id) ?? notFound(reply, 'dish');
  });

  app.put('/api/dishes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = parseBody(DishUpdate, req.body, reply);
    if (!patch) return;
    return store.updateDish(id, patch) ?? notFound(reply, 'dish');
  });

  app.delete('/api/dishes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = store.getDish(id);
    if (!existing || !store.deleteDish(id)) return notFound(reply, 'dish');
    removeImageFile(uploadsDir, existing.image); // don't orphan the cover file
    reply.code(204);
    return null;
  });

  registerImageRoutes(app, uploadsDir, {
    basePath: '/api/dishes',
    name: 'dish',
    get: (id) => store.getDish(id),
    setImage: (id, image) => store.updateDish(id, { image }),
  });
}
