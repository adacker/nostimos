// CONTRACT:S2-STORAGE.1.0
// SQLite-backed persistence for Nostimos, using Node's built-in node:sqlite.
// Array-valued fields (labelIds, recipeIds, dishIds) are stored as JSON text
// columns and (de)serialised at the boundary so callers only ever see the
// shared domain types.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
// node:sqlite is a newer built-in that bundlers (Vite/Vitest) don't yet list as
// a known node builtin, so a static `import` gets mis-resolved to a bare
// `sqlite` package. Loading it through createRequire keeps it a runtime Node
// require that bundlers leave untouched.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
import type {
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  Dish,
  DishCreate,
  DishUpdate,
  Menu,
  MenuCreate,
  MenuUpdate,
  MealPlanEntry,
  MealPlanEntryCreate,
  MealPlanEntryUpdate,
  DishLabel,
  DishLabelCreate,
  DishCategory,
  DishCategoryCreate,
  DayLabel,
  DayLabelCreate,
} from '@nostimos/shared';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ingredients TEXT NOT NULL DEFAULT '',
  steps TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  rating INTEGER,
  source_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dish_labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT
);
CREATE TABLE IF NOT EXISTS dish_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT,
  label_ids TEXT NOT NULL DEFAULT '[]',
  recipe_ids TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  dish_ids TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  dish_id TEXT,
  menu_id TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_date ON meal_plan_entries (date);
CREATE TABLE IF NOT EXISTS day_labels (
  id TEXT PRIMARY KEY,
  weekday INTEGER NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

const now = () => new Date().toISOString();

type Row = Record<string, unknown>;
const asInt = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const asArr = (v: unknown): string[] => {
  try {
    const parsed = JSON.parse(String(v ?? '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

function toRecipe(r: Row): Recipe {
  return {
    id: String(r.id),
    title: String(r.title),
    ingredients: String(r.ingredients ?? ''),
    steps: String(r.steps ?? ''),
    notes: String(r.notes ?? ''),
    rating: asInt(r.rating),
    sourceUrl: r.source_url === null || r.source_url === undefined ? null : String(r.source_url),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
function toDish(r: Row): Dish {
  return {
    id: String(r.id),
    name: String(r.name),
    categoryId: r.category_id === null || r.category_id === undefined ? null : String(r.category_id),
    labelIds: asArr(r.label_ids),
    recipeIds: asArr(r.recipe_ids),
    notes: String(r.notes ?? ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
function toMenu(r: Row): Menu {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    dishIds: asArr(r.dish_ids),
    notes: String(r.notes ?? ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
function toEntry(r: Row): MealPlanEntry {
  return {
    id: String(r.id),
    date: String(r.date),
    slot: String(r.slot) as MealPlanEntry['slot'],
    dishId: r.dish_id === null || r.dish_id === undefined ? null : String(r.dish_id),
    menuId: r.menu_id === null || r.menu_id === undefined ? null : String(r.menu_id),
    notes: String(r.notes ?? ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  } as MealPlanEntry;
}

/** Typed, synchronous data store. One instance owns one SQLite connection. */
export class Store {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA);
  }

  close(): void {
    this.db.close();
  }

  // ── Recipes ────────────────────────────────────────────────────────────
  listRecipes(): Recipe[] {
    return (this.db.prepare('SELECT * FROM recipes ORDER BY title COLLATE NOCASE').all() as Row[]).map(toRecipe);
  }
  getRecipe(id: string): Recipe | undefined {
    const r = this.db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Row | undefined;
    return r ? toRecipe(r) : undefined;
  }
  createRecipe(input: RecipeCreate): Recipe {
    const id = randomUUID();
    const ts = now();
    this.db
      .prepare(
        `INSERT INTO recipes (id, title, ingredients, steps, notes, rating, source_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.title, input.ingredients, input.steps, input.notes, input.rating, input.sourceUrl, ts, ts);
    return this.getRecipe(id)!;
  }
  updateRecipe(id: string, patch: RecipeUpdate): Recipe | undefined {
    const existing = this.getRecipe(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    this.db
      .prepare(
        `UPDATE recipes SET title=?, ingredients=?, steps=?, notes=?, rating=?, source_url=?, updated_at=? WHERE id=?`,
      )
      .run(next.title, next.ingredients, next.steps, next.notes, next.rating, next.sourceUrl, now(), id);
    return this.getRecipe(id);
  }
  deleteRecipe(id: string): boolean {
    return this.db.prepare('DELETE FROM recipes WHERE id = ?').run(id).changes > 0;
  }

  // ── Dish labels ────────────────────────────────────────────────────────
  listLabels(): DishLabel[] {
    return (this.db.prepare('SELECT * FROM dish_labels ORDER BY name COLLATE NOCASE').all() as Row[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      color: r.color === null || r.color === undefined ? null : String(r.color),
    }));
  }
  createLabel(input: DishLabelCreate): DishLabel {
    const id = randomUUID();
    this.db.prepare('INSERT INTO dish_labels (id, name, color) VALUES (?, ?, ?)').run(id, input.name, input.color);
    return { id, ...input };
  }
  deleteLabel(id: string): boolean {
    return this.db.prepare('DELETE FROM dish_labels WHERE id = ?').run(id).changes > 0;
  }

  // ── Dish categories ──────────────────────────────────────────────────────
  listCategories(): DishCategory[] {
    return (this.db.prepare('SELECT * FROM dish_categories ORDER BY name COLLATE NOCASE').all() as Row[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
    }));
  }
  createCategory(input: DishCategoryCreate): DishCategory {
    const id = randomUUID();
    this.db.prepare('INSERT INTO dish_categories (id, name) VALUES (?, ?)').run(id, input.name);
    return { id, ...input };
  }
  deleteCategory(id: string): boolean {
    return this.db.prepare('DELETE FROM dish_categories WHERE id = ?').run(id).changes > 0;
  }

  // ── Dishes ───────────────────────────────────────────────────────────────
  listDishes(): Dish[] {
    return (this.db.prepare('SELECT * FROM dishes ORDER BY name COLLATE NOCASE').all() as Row[]).map(toDish);
  }
  getDish(id: string): Dish | undefined {
    const r = this.db.prepare('SELECT * FROM dishes WHERE id = ?').get(id) as Row | undefined;
    return r ? toDish(r) : undefined;
  }
  createDish(input: DishCreate): Dish {
    const id = randomUUID();
    const ts = now();
    this.db
      .prepare(
        `INSERT INTO dishes (id, name, category_id, label_ids, recipe_ids, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.name, input.categoryId, JSON.stringify(input.labelIds), JSON.stringify(input.recipeIds), input.notes, ts, ts);
    return this.getDish(id)!;
  }
  updateDish(id: string, patch: DishUpdate): Dish | undefined {
    const existing = this.getDish(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    this.db
      .prepare(
        `UPDATE dishes SET name=?, category_id=?, label_ids=?, recipe_ids=?, notes=?, updated_at=? WHERE id=?`,
      )
      .run(next.name, next.categoryId, JSON.stringify(next.labelIds), JSON.stringify(next.recipeIds), next.notes, now(), id);
    return this.getDish(id);
  }
  deleteDish(id: string): boolean {
    return this.db.prepare('DELETE FROM dishes WHERE id = ?').run(id).changes > 0;
  }

  // ── Menus ──────────────────────────────────────────────────────────────
  listMenus(): Menu[] {
    return (this.db.prepare('SELECT * FROM menus ORDER BY name COLLATE NOCASE').all() as Row[]).map(toMenu);
  }
  getMenu(id: string): Menu | undefined {
    const r = this.db.prepare('SELECT * FROM menus WHERE id = ?').get(id) as Row | undefined;
    return r ? toMenu(r) : undefined;
  }
  createMenu(input: MenuCreate): Menu {
    const id = randomUUID();
    const ts = now();
    this.db
      .prepare('INSERT INTO menus (id, name, dish_ids, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, input.name, JSON.stringify(input.dishIds), input.notes, ts, ts);
    return this.getMenu(id)!;
  }
  updateMenu(id: string, patch: MenuUpdate): Menu | undefined {
    const existing = this.getMenu(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    this.db
      .prepare('UPDATE menus SET name=?, dish_ids=?, notes=?, updated_at=? WHERE id=?')
      .run(next.name, JSON.stringify(next.dishIds), next.notes, now(), id);
    return this.getMenu(id);
  }
  deleteMenu(id: string): boolean {
    return this.db.prepare('DELETE FROM menus WHERE id = ?').run(id).changes > 0;
  }

  // ── Meal plan entries ────────────────────────────────────────────────────
  listEntries(from?: string, to?: string): MealPlanEntry[] {
    let sql = 'SELECT * FROM meal_plan_entries';
    const params: string[] = [];
    if (from && to) {
      sql += ' WHERE date BETWEEN ? AND ?';
      params.push(from, to);
    }
    sql += ' ORDER BY date, slot';
    return (this.db.prepare(sql).all(...params) as Row[]).map(toEntry);
  }
  getEntry(id: string): MealPlanEntry | undefined {
    const r = this.db.prepare('SELECT * FROM meal_plan_entries WHERE id = ?').get(id) as Row | undefined;
    return r ? toEntry(r) : undefined;
  }
  createEntry(input: MealPlanEntryCreate): MealPlanEntry {
    const id = randomUUID();
    const ts = now();
    this.db
      .prepare(
        `INSERT INTO meal_plan_entries (id, date, slot, dish_id, menu_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.date, input.slot, input.dishId, input.menuId, input.notes, ts, ts);
    return this.getEntry(id)!;
  }
  updateEntry(id: string, patch: MealPlanEntryUpdate): MealPlanEntry | undefined {
    const existing = this.getEntry(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    this.db
      .prepare('UPDATE meal_plan_entries SET date=?, slot=?, dish_id=?, menu_id=?, notes=?, updated_at=? WHERE id=?')
      .run(next.date, next.slot, next.dishId, next.menuId, next.notes, now(), id);
    return this.getEntry(id);
  }
  deleteEntry(id: string): boolean {
    return this.db.prepare('DELETE FROM meal_plan_entries WHERE id = ?').run(id).changes > 0;
  }

  // ── Day labels ───────────────────────────────────────────────────────────
  listDayLabels(): DayLabel[] {
    return (this.db.prepare('SELECT * FROM day_labels ORDER BY weekday').all() as Row[]).map((r) => ({
      id: String(r.id),
      weekday: Number(r.weekday),
      label: String(r.label),
      createdAt: String(r.created_at),
    }));
  }
  createDayLabel(input: DayLabelCreate): DayLabel {
    const id = randomUUID();
    const createdAt = now();
    this.db
      .prepare('INSERT INTO day_labels (id, weekday, label, created_at) VALUES (?, ?, ?, ?)')
      .run(id, input.weekday, input.label, createdAt);
    return { id, createdAt, ...input };
  }
  deleteDayLabel(id: string): boolean {
    return this.db.prepare('DELETE FROM day_labels WHERE id = ?').run(id).changes > 0;
  }
}
