// CONTRACT:S1-API.1.0
// Menu endpoints: CRUD. A menu has an optional name and one or more dishes.
import type { FastifyInstance } from 'fastify';
import { MenuCreate, MenuUpdate } from '@nostimos/shared';
import type { Store } from '../db.js';
import { parseBody, notFound } from './http.js';

export function registerMenuRoutes(app: FastifyInstance, store: Store): void {
  app.get('/api/menus', async () => store.listMenus());

  app.post('/api/menus', async (req, reply) => {
    const input = parseBody(MenuCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createMenu(input);
  });

  app.get('/api/menus/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    return store.getMenu(id) ?? notFound(reply, 'menu');
  });

  app.put('/api/menus/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = parseBody(MenuUpdate, req.body, reply);
    if (!patch) return;
    return store.updateMenu(id, patch) ?? notFound(reply, 'menu');
  });

  app.delete('/api/menus/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!store.deleteMenu(id)) return notFound(reply, 'menu');
    reply.code(204);
    return null;
  });
}
