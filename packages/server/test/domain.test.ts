// CONTRACT:I1-DOMAIN.1.0
import { describe, it, expect } from 'vitest';
import { Recipe, MealPlanEntry, RecipeCreate } from '@nostimos/shared';

describe('Domain schemas (I1-DOMAIN)', () => {
  it('rejects a recipe rating outside 1..5', () => {
    const base = {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'X',
      ingredients: '',
      steps: '',
      notes: '',
      sourceUrl: null,
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    };
    expect(Recipe.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(Recipe.safeParse({ ...base, rating: 5 }).success).toBe(true);
  });

  it('applies defaults on RecipeCreate', () => {
    const parsed = RecipeCreate.parse({ title: 'Quick', rating: null, sourceUrl: null });
    expect(parsed.ingredients).toBe('');
    expect(parsed.notes).toBe('');
  });

  it('requires exactly one of dishId / menuId on a plan entry', () => {
    const meta = {
      id: '77777777-7777-7777-7777-777777777777',
      date: '2026-06-20',
      slot: 'dinner' as const,
      notes: '',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    };
    expect(MealPlanEntry.safeParse({ ...meta, dishId: null, menuId: null }).success).toBe(false);
    expect(
      MealPlanEntry.safeParse({ ...meta, dishId: '88888888-8888-8888-8888-888888888888', menuId: null }).success,
    ).toBe(true);
  });

  it('rejects a malformed calendar date', () => {
    const meta = {
      id: '99999999-9999-9999-9999-999999999999',
      slot: 'lunch' as const,
      dishId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      menuId: null,
      notes: '',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    };
    expect(MealPlanEntry.safeParse({ ...meta, date: '06/20/2026' }).success).toBe(false);
  });
});
