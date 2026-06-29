// CONTRACT:C2-API-CLIENT.1.0
// Browser-only implementation of the Backend interface, backed by localStorage.
// Used for standalone / static deployments (e.g. here.now) where no Fastify
// server is available. Mirrors the server's behaviour: assigns ids + timestamps,
// validates via the shared *Create schemas, and persists authoritatively to one
// localStorage key. Single device — no cross-device sync.
import {
  RecipeCreate,
  DishCreate,
  MenuCreate,
  MealPlanEntryCreate,
  DishLabelCreate,
  DishCategoryCreate,
  DayLabelCreate,
  parseRecipeText,
  type Recipe,
  type Dish,
  type Menu,
  type MealPlanEntry,
  type DishLabel,
  type DishCategory,
  type DayLabel,
} from '@nostimos/shared';
import type { Backend } from './api.js';
import { compressImage, blobToDataUrl } from './image.js';

const KEY = 'nostimos-local-v1';

interface Data {
  recipes: Recipe[];
  dishes: Dish[];
  menus: Menu[];
  labels: DishLabel[];
  categories: DishCategory[];
  dayLabels: DayLabel[];
  plan: MealPlanEntry[];
}
const empty: Data = { recipes: [], dishes: [], menus: [], labels: [], categories: [], dayLabels: [], plan: [] };

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<Data>) } : { ...empty };
  } catch {
    return { ...empty };
  }
}
function save(d: Data): void {
  localStorage.setItem(KEY, JSON.stringify(d));
}

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

/** Mutate the stored data with `fn`, persist, and return its result. */
function tx<T>(fn: (d: Data) => T): Promise<T> {
  const d = load();
  const result = fn(d);
  save(d);
  return Promise.resolve(result);
}

export const localApi: Backend = {
  health: () => Promise.resolve({ status: 'ok' }),

  // ── Recipes ──
  listRecipes: () => Promise.resolve(load().recipes),
  createRecipe: (input) =>
    tx((d) => {
      const r: Recipe = { id: uuid(), ...RecipeCreate.parse(input), createdAt: now(), updatedAt: now() };
      d.recipes.push(r);
      return r;
    }),
  importRecipe: (text) =>
    tx((d) => {
      const r: Recipe = { id: uuid(), ...parseRecipeText(text), createdAt: now(), updatedAt: now() };
      d.recipes.push(r);
      return r;
    }),
  updateRecipe: (id, patch) =>
    tx((d) => {
      const i = d.recipes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('recipe not found');
      d.recipes[i] = { ...d.recipes[i]!, ...patch, updatedAt: now() };
      return d.recipes[i]!;
    }),
  deleteRecipe: (id) =>
    tx((d) => {
      d.recipes = d.recipes.filter((x) => x.id !== id);
    }),
  setRecipeImage: async (id, file) => {
    const image = await blobToDataUrl(await compressImage(file));
    return tx((d) => {
      const i = d.recipes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('recipe not found');
      d.recipes[i] = { ...d.recipes[i]!, image, updatedAt: now() };
      return d.recipes[i]!;
    });
  },
  clearRecipeImage: (id) =>
    tx((d) => {
      const i = d.recipes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('recipe not found');
      d.recipes[i] = { ...d.recipes[i]!, image: null, updatedAt: now() };
      return d.recipes[i]!;
    }),

  // ── Dishes ──
  listDishes: () => Promise.resolve(load().dishes),
  createDish: (input) =>
    tx((d) => {
      const dish: Dish = { id: uuid(), ...DishCreate.parse(input), createdAt: now(), updatedAt: now() };
      d.dishes.push(dish);
      return dish;
    }),
  updateDish: (id, patch) =>
    tx((d) => {
      const i = d.dishes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('dish not found');
      d.dishes[i] = { ...d.dishes[i]!, ...patch, updatedAt: now() };
      return d.dishes[i]!;
    }),
  deleteDish: (id) =>
    tx((d) => {
      d.dishes = d.dishes.filter((x) => x.id !== id);
    }),
  setDishImage: async (id, file) => {
    const image = await blobToDataUrl(await compressImage(file));
    return tx((d) => {
      const i = d.dishes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('dish not found');
      d.dishes[i] = { ...d.dishes[i]!, image, updatedAt: now() };
      return d.dishes[i]!;
    });
  },
  clearDishImage: (id) =>
    tx((d) => {
      const i = d.dishes.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('dish not found');
      d.dishes[i] = { ...d.dishes[i]!, image: null, updatedAt: now() };
      return d.dishes[i]!;
    }),

  // ── Menus ──
  listMenus: () => Promise.resolve(load().menus),
  createMenu: (input) =>
    tx((d) => {
      const m: Menu = { id: uuid(), ...MenuCreate.parse(input), createdAt: now(), updatedAt: now() };
      d.menus.push(m);
      return m;
    }),
  updateMenu: (id, patch) =>
    tx((d) => {
      const i = d.menus.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('menu not found');
      d.menus[i] = { ...d.menus[i]!, ...patch, updatedAt: now() };
      return d.menus[i]!;
    }),
  deleteMenu: (id) =>
    tx((d) => {
      d.menus = d.menus.filter((x) => x.id !== id);
    }),

  // ── Taxonomy ──
  listLabels: () => Promise.resolve(load().labels),
  createLabel: (input) =>
    tx((d) => {
      const l: DishLabel = { id: uuid(), ...DishLabelCreate.parse(input) };
      d.labels.push(l);
      return l;
    }),
  deleteLabel: (id) =>
    tx((d) => {
      d.labels = d.labels.filter((x) => x.id !== id);
    }),
  listCategories: () => Promise.resolve(load().categories),
  createCategory: (input) =>
    tx((d) => {
      const c: DishCategory = { id: uuid(), ...DishCategoryCreate.parse(input) };
      d.categories.push(c);
      return c;
    }),
  deleteCategory: (id) =>
    tx((d) => {
      d.categories = d.categories.filter((x) => x.id !== id);
    }),
  listDayLabels: () => Promise.resolve(load().dayLabels),
  createDayLabel: (input) =>
    tx((d) => {
      const dl: DayLabel = { id: uuid(), ...DayLabelCreate.parse(input), createdAt: now() };
      d.dayLabels.push(dl);
      return dl;
    }),
  deleteDayLabel: (id) =>
    tx((d) => {
      d.dayLabels = d.dayLabels.filter((x) => x.id !== id);
    }),

  // ── Meal plan ──
  listPlan: (from, to) =>
    Promise.resolve(
      load().plan.filter((e) => (from && to ? e.date >= from && e.date <= to : true)).sort((a, b) => a.date.localeCompare(b.date)),
    ),
  createEntry: (input) =>
    tx((d) => {
      const e = { id: uuid(), ...MealPlanEntryCreate.parse(input), createdAt: now(), updatedAt: now() } as MealPlanEntry;
      d.plan.push(e);
      return e;
    }),
  updateEntry: (id, patch) =>
    tx((d) => {
      const i = d.plan.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('plan entry not found');
      d.plan[i] = { ...d.plan[i]!, ...patch, updatedAt: now() } as MealPlanEntry;
      return d.plan[i]!;
    }),
  deleteEntry: (id) =>
    tx((d) => {
      d.plan = d.plan.filter((x) => x.id !== id);
    }),
};
