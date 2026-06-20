// CONTRACT:C3-STORE.1.0
// Local-first application store for Nostimos. Reads are served instantly from a
// localStorage cache and refreshed from the backend; writes are server-first
// and update both the in-memory state and the cache on success. (An offline
// write queue is a tracked future enhancement — see TODO.md.)
import type {
  Recipe,
  Dish,
  Menu,
  MealPlanEntry,
  DishLabel,
  DishCategory,
  DayLabel,
  RecipeCreate,
  RecipeUpdate,
  DishCreate,
  DishUpdate,
  MenuCreate,
  MenuUpdate,
  MealPlanEntryCreate,
  MealPlanEntryUpdate,
  DishLabelCreate,
  DishCategoryCreate,
  DayLabelCreate,
} from '@nostimos/shared';
import { api, ApiError } from './api.js';

const CACHE_KEY = 'nostimos-cache-v1';

interface Snapshot {
  recipes: Recipe[];
  dishes: Dish[];
  menus: Menu[];
  labels: DishLabel[];
  categories: DishCategory[];
  dayLabels: DayLabel[];
  plan: MealPlanEntry[];
}

const empty: Snapshot = {
  recipes: [],
  dishes: [],
  menus: [],
  labels: [],
  categories: [],
  dayLabels: [],
  plan: [],
};

function loadCache(): Snapshot {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { ...empty };
    return { ...empty, ...(JSON.parse(raw) as Partial<Snapshot>) };
  } catch {
    return { ...empty };
  }
}

class AppStore {
  recipes = $state<Recipe[]>([]);
  dishes = $state<Dish[]>([]);
  menus = $state<Menu[]>([]);
  labels = $state<DishLabel[]>([]);
  categories = $state<DishCategory[]>([]);
  dayLabels = $state<DayLabel[]>([]);
  plan = $state<MealPlanEntry[]>([]);

  online = $state(true);
  syncing = $state(false);
  lastError = $state<string | null>(null);
  lastSyncedAt = $state<string | null>(null);

  constructor() {
    const c = loadCache();
    this.recipes = c.recipes;
    this.dishes = c.dishes;
    this.menus = c.menus;
    this.labels = c.labels;
    this.categories = c.categories;
    this.dayLabels = c.dayLabels;
    this.plan = c.plan;
  }

  private cache(): void {
    const snap: Snapshot = {
      recipes: this.recipes,
      dishes: this.dishes,
      menus: this.menus,
      labels: this.labels,
      categories: this.categories,
      dayLabels: this.dayLabels,
      plan: this.plan,
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
    } catch {
      /* cache is best-effort */
    }
  }

  /** Pull every collection from the backend and replace local state + cache. */
  async refresh(): Promise<void> {
    this.syncing = true;
    this.lastError = null;
    try {
      const [recipes, dishes, menus, labels, categories, dayLabels, plan] = await Promise.all([
        api.listRecipes(),
        api.listDishes(),
        api.listMenus(),
        api.listLabels(),
        api.listCategories(),
        api.listDayLabels(),
        api.listPlan(),
      ]);
      this.recipes = recipes;
      this.dishes = dishes;
      this.menus = menus;
      this.labels = labels;
      this.categories = categories;
      this.dayLabels = dayLabels;
      this.plan = plan;
      this.online = true;
      this.lastSyncedAt = new Date().toISOString();
      this.cache();
    } catch (err) {
      this.online = false;
      this.lastError = err instanceof Error ? err.message : 'sync failed';
    } finally {
      this.syncing = false;
    }
  }

  private async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      const result = await fn();
      this.online = true;
      this.lastError = null;
      this.cache();
      return result;
    } catch (err) {
      this.online = !(err instanceof TypeError); // TypeError == network failure
      this.lastError = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      return undefined;
    }
  }

  // ── Recipes ──
  addRecipe(r: RecipeCreate) {
    return this.run(async () => {
      const created = await api.createRecipe(r);
      this.recipes = [...this.recipes, created].sort(byTitle);
      return created;
    });
  }
  importRecipe(text: string) {
    return this.run(async () => {
      const created = await api.importRecipe(text);
      this.recipes = [...this.recipes, created].sort(byTitle);
      return created;
    });
  }
  editRecipe(id: string, patch: RecipeUpdate) {
    return this.run(async () => {
      const updated = await api.updateRecipe(id, patch);
      this.recipes = this.recipes.map((x) => (x.id === id ? updated : x)).sort(byTitle);
      return updated;
    });
  }
  removeRecipe(id: string) {
    return this.run(async () => {
      await api.deleteRecipe(id);
      this.recipes = this.recipes.filter((x) => x.id !== id);
    });
  }

  // ── Dishes ──
  addDish(d: DishCreate) {
    return this.run(async () => {
      const created = await api.createDish(d);
      this.dishes = [...this.dishes, created].sort(byName);
      return created;
    });
  }
  editDish(id: string, patch: DishUpdate) {
    return this.run(async () => {
      const updated = await api.updateDish(id, patch);
      this.dishes = this.dishes.map((x) => (x.id === id ? updated : x)).sort(byName);
      return updated;
    });
  }
  removeDish(id: string) {
    return this.run(async () => {
      await api.deleteDish(id);
      this.dishes = this.dishes.filter((x) => x.id !== id);
    });
  }

  // ── Menus ──
  addMenu(m: MenuCreate) {
    return this.run(async () => {
      const created = await api.createMenu(m);
      this.menus = [...this.menus, created];
      return created;
    });
  }
  editMenu(id: string, patch: MenuUpdate) {
    return this.run(async () => {
      const updated = await api.updateMenu(id, patch);
      this.menus = this.menus.map((x) => (x.id === id ? updated : x));
      return updated;
    });
  }
  removeMenu(id: string) {
    return this.run(async () => {
      await api.deleteMenu(id);
      this.menus = this.menus.filter((x) => x.id !== id);
    });
  }

  // ── Taxonomy ──
  addLabel(l: DishLabelCreate) {
    return this.run(async () => {
      const created = await api.createLabel(l);
      this.labels = [...this.labels, created].sort(byName);
      return created;
    });
  }
  removeLabel(id: string) {
    return this.run(async () => {
      await api.deleteLabel(id);
      this.labels = this.labels.filter((x) => x.id !== id);
    });
  }
  addCategory(c: DishCategoryCreate) {
    return this.run(async () => {
      const created = await api.createCategory(c);
      this.categories = [...this.categories, created].sort(byName);
      return created;
    });
  }
  removeCategory(id: string) {
    return this.run(async () => {
      await api.deleteCategory(id);
      this.categories = this.categories.filter((x) => x.id !== id);
    });
  }
  addDayLabel(d: DayLabelCreate) {
    return this.run(async () => {
      const created = await api.createDayLabel(d);
      this.dayLabels = [...this.dayLabels, created];
      return created;
    });
  }
  removeDayLabel(id: string) {
    return this.run(async () => {
      await api.deleteDayLabel(id);
      this.dayLabels = this.dayLabels.filter((x) => x.id !== id);
    });
  }

  // ── Meal plan ──
  addEntry(e: MealPlanEntryCreate) {
    return this.run(async () => {
      const created = await api.createEntry(e);
      this.plan = [...this.plan, created];
      return created;
    });
  }
  editEntry(id: string, patch: MealPlanEntryUpdate) {
    return this.run(async () => {
      const updated = await api.updateEntry(id, patch);
      this.plan = this.plan.map((x) => (x.id === id ? updated : x));
      return updated;
    });
  }
  removeEntry(id: string) {
    return this.run(async () => {
      await api.deleteEntry(id);
      this.plan = this.plan.filter((x) => x.id !== id);
    });
  }

  // ── Lookups ──
  recipeById(id: string) {
    return this.recipes.find((r) => r.id === id);
  }
  dishById(id: string) {
    return this.dishes.find((d) => d.id === id);
  }
  menuById(id: string) {
    return this.menus.find((m) => m.id === id);
  }
  labelById(id: string) {
    return this.labels.find((l) => l.id === id);
  }
  categoryById(id: string) {
    return this.categories.find((c) => c.id === id);
  }
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export const store = new AppStore();
