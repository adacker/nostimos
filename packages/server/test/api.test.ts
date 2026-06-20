// CONTRACT:S1-API.1.0
// CONTRACT:P1-API-PROTOCOL.1.0
import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

let app: FastifyInstance;
afterEach(async () => {
  await app?.close();
});

describe('HTTP API (S1-API / P1-API-PROTOCOL)', () => {
  it('health check responds ok', async () => {
    app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('creates a recipe and lists it', async () => {
    app = buildApp();
    const create = await app.inject({
      method: 'POST',
      url: '/api/recipes',
      payload: { title: 'Spanakopita', ingredients: 'spinach\nfeta', steps: 'bake', notes: '', rating: null, sourceUrl: null },
    });
    expect(create.statusCode).toBe(201);
    const recipe = create.json();
    expect(recipe.id).toBeTruthy();

    const list = await app.inject({ method: 'GET', url: '/api/recipes' });
    expect(list.json()).toHaveLength(1);
  });

  it('returns a 400 with a uniform error envelope on invalid input', async () => {
    app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/recipes', payload: { title: '' } });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('validation failed');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it('imports a recipe from plain text', async () => {
    app = buildApp();
    const text = 'Greek Salad\nIngredients\ntomato\ncucumber\nSteps\nchop and toss\nSource: https://example.com/salad';
    const res = await app.inject({ method: 'POST', url: '/api/recipes/import', payload: { text } });
    expect(res.statusCode).toBe(201);
    const recipe = res.json();
    expect(recipe.title).toBe('Greek Salad');
    expect(recipe.sourceUrl).toBe('https://example.com/salad');
  });

  it('404s for a missing recipe', async () => {
    app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/recipes/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('not found');
  });

  it('rejects a plan entry that references both a dish and a menu', async () => {
    app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/plan',
      payload: { date: '2026-06-20', slot: 'dinner', dishId: '44444444-4444-4444-4444-444444444444', menuId: '55555555-5555-5555-5555-555555555555' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates and ranges meal-plan entries', async () => {
    app = buildApp();
    const dish = (
      await app.inject({ method: 'POST', url: '/api/dishes', payload: { name: 'Pasta', categoryId: null, labelIds: [], recipeIds: [], notes: '' } })
    ).json();
    const created = await app.inject({
      method: 'POST',
      url: '/api/plan',
      payload: { date: '2026-06-20', slot: 'dinner', dishId: dish.id, menuId: null },
    });
    expect(created.statusCode).toBe(201);
    const ranged = await app.inject({ method: 'GET', url: '/api/plan?from=2026-06-01&to=2026-06-30' });
    expect(ranged.json()).toHaveLength(1);
  });
});
