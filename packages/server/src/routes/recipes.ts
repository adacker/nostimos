// CONTRACT:S1-API.1.0
// Recipe endpoints: CRUD plus plain-text import.
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { RecipeCreate, RecipeUpdate, parseRecipeText } from '@nostimos/shared';
import type { Store } from '../db.js';
import { parseBody, notFound } from './http.js';
import { registerImageRoutes, removeImageFile } from './images.js';

const ImportBody = z.object({ text: z.string().min(1) });

export function registerRecipeRoutes(app: FastifyInstance, store: Store, uploadsDir: string): void {
  app.get('/api/recipes', async () => store.listRecipes());

  app.post('/api/recipes', async (req, reply) => {
    const input = parseBody(RecipeCreate, req.body, reply);
    if (!input) return;
    reply.code(201);
    return store.createRecipe(input);
  });

  app.post('/api/recipes/import', async (req, reply) => {
    const body = parseBody(ImportBody, req.body, reply);
    if (!body) return;
    const parsed = parseRecipeText(body.text);
    reply.code(201);
    return store.createRecipe(parsed);
  });

  app.get('/api/recipes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    return store.getRecipe(id) ?? notFound(reply, 'recipe');
  });

  app.put('/api/recipes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = parseBody(RecipeUpdate, req.body, reply);
    if (!patch) return;
    return store.updateRecipe(id, patch) ?? notFound(reply, 'recipe');
  });

  app.delete('/api/recipes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = store.getRecipe(id);
    if (!existing || !store.deleteRecipe(id)) return notFound(reply, 'recipe');
    removeImageFile(uploadsDir, existing.image); // don't orphan the cover file
    reply.code(204);
    return null;
  });

  registerImageRoutes(app, uploadsDir, {
    basePath: '/api/recipes',
    name: 'recipe',
    get: (id) => store.getRecipe(id),
    setImage: (id, image) => store.updateRecipe(id, { image }),
  });
}
