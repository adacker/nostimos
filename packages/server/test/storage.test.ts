// CONTRACT:S2-STORAGE.1.0
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../src/db.js';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

describe('Store (S2-STORAGE)', () => {
  it('creates and reads a recipe with server-assigned id + timestamps', () => {
    const s = new Store(':memory:');
    const r = s.createRecipe({
      title: 'Avgolemono',
      ingredients: 'chicken\nlemon\negg\nrice',
      steps: 'simmer; temper eggs; combine',
      notes: 'family favourite',
      rating: 5,
      sourceUrl: null,
      image: null,
    });
    expect(r.id).toMatch(/[0-9a-f-]{36}/);
    expect(r.createdAt).toBe(r.updatedAt);
    expect(r.image).toBeNull();
    expect(s.getRecipe(r.id)?.title).toBe('Avgolemono');
    expect(s.listRecipes()).toHaveLength(1);
  });

  it('round-trips dish array fields (labels + recipes) through JSON columns', () => {
    const s = new Store(':memory:');
    const dish = s.createDish({
      name: 'Tacos al Pastor',
      categoryId: null,
      labelIds: ['11111111-1111-1111-1111-111111111111'],
      recipeIds: ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'],
      notes: '',
      image: null,
    });
    const fetched = s.getDish(dish.id)!;
    expect(fetched.labelIds).toEqual(['11111111-1111-1111-1111-111111111111']);
    expect(fetched.recipeIds).toHaveLength(2);
  });

  it('updates touch updatedAt and persist the patch', async () => {
    const s = new Store(':memory:');
    const r = s.createRecipe({ title: 'A', ingredients: '', steps: '', notes: '', rating: null, sourceUrl: null, image: null });
    await new Promise((res) => setTimeout(res, 5));
    const updated = s.updateRecipe(r.id, { rating: 4 })!;
    expect(updated.rating).toBe(4);
    expect(updated.updatedAt >= r.updatedAt).toBe(true);
  });

  it('persists and clears a recipe cover image', () => {
    const s = new Store(':memory:');
    const r = s.createRecipe({ title: 'B', ingredients: '', steps: '', notes: '', rating: null, sourceUrl: null, image: null });
    const withImage = s.updateRecipe(r.id, { image: '/api/uploads/x.jpg' })!;
    expect(withImage.image).toBe('/api/uploads/x.jpg');
    const cleared = s.updateRecipe(r.id, { image: null })!;
    expect(cleared.image).toBeNull();
  });

  it('returns undefined / false for missing rows', () => {
    const s = new Store(':memory:');
    expect(s.getRecipe('nope')).toBeUndefined();
    expect(s.deleteRecipe('nope')).toBe(false);
  });

  it('filters meal-plan entries by date range', () => {
    const s = new Store(':memory:');
    const d = s.createDish({ name: 'Soup', categoryId: null, labelIds: [], recipeIds: [], notes: '', image: null });
    s.createEntry({ date: '2026-06-01', slot: 'dinner', dishId: d.id, menuId: null, notes: '' });
    s.createEntry({ date: '2026-06-20', slot: 'dinner', dishId: d.id, menuId: null, notes: '' });
    expect(s.listEntries('2026-06-15', '2026-06-30')).toHaveLength(1);
    expect(s.listEntries()).toHaveLength(2);
  });

  it('migrates a pre-image database by adding the image column', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nostimos-mig-'));
    const file = join(dir, 'legacy.db');
    try {
      // Recreate a v1 recipes table that predates the image column.
      const legacy = new DatabaseSync(file);
      legacy.exec(
        `CREATE TABLE recipes (id TEXT PRIMARY KEY, title TEXT NOT NULL, ingredients TEXT NOT NULL DEFAULT '',
          steps TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', rating INTEGER, source_url TEXT,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
      );
      legacy.prepare('INSERT INTO recipes (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run('r1', 'Old', 't', 't');
      legacy.close();

      // Opening through Store should add the column without losing the row.
      const s = new Store(file);
      const r = s.getRecipe('r1');
      expect(r?.title).toBe('Old');
      expect(r?.image).toBeNull();
      s.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
