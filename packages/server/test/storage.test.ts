// CONTRACT:S2-STORAGE.1.0
import { describe, it, expect } from 'vitest';
import { Store } from '../src/db.js';

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
    });
    expect(r.id).toMatch(/[0-9a-f-]{36}/);
    expect(r.createdAt).toBe(r.updatedAt);
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
    });
    const fetched = s.getDish(dish.id)!;
    expect(fetched.labelIds).toEqual(['11111111-1111-1111-1111-111111111111']);
    expect(fetched.recipeIds).toHaveLength(2);
  });

  it('updates touch updatedAt and persist the patch', async () => {
    const s = new Store(':memory:');
    const r = s.createRecipe({ title: 'A', ingredients: '', steps: '', notes: '', rating: null, sourceUrl: null });
    await new Promise((res) => setTimeout(res, 5));
    const updated = s.updateRecipe(r.id, { rating: 4 })!;
    expect(updated.rating).toBe(4);
    expect(updated.updatedAt >= r.updatedAt).toBe(true);
  });

  it('returns undefined / false for missing rows', () => {
    const s = new Store(':memory:');
    expect(s.getRecipe('nope')).toBeUndefined();
    expect(s.deleteRecipe('nope')).toBe(false);
  });

  it('filters meal-plan entries by date range', () => {
    const s = new Store(':memory:');
    const d = s.createDish({ name: 'Soup', categoryId: null, labelIds: [], recipeIds: [], notes: '' });
    s.createEntry({ date: '2026-06-01', slot: 'dinner', dishId: d.id, menuId: null, notes: '' });
    s.createEntry({ date: '2026-06-20', slot: 'dinner', dishId: d.id, menuId: null, notes: '' });
    expect(s.listEntries('2026-06-15', '2026-06-30')).toHaveLength(1);
    expect(s.listEntries()).toHaveLength(2);
  });
});
