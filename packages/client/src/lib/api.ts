// CONTRACT:C2-API-CLIENT.1.0
// Typed fetch wrapper over the Nostimos REST API. All network access from the
// client goes through this module so the local-first store has a single seam to
// the backend.
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
import { compressImage } from './image.js';

const BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const msg = (data && (data.error as string)) || `request failed (${res.status})`;
    throw new ApiError(res.status, msg, data?.issues);
  }
  return data as T;
}

/** Compress `file` in the browser and POST it as multipart to an image endpoint. */
async function uploadImage<T>(path: string, file: File): Promise<T> {
  const blob = await compressImage(file);
  const form = new FormData();
  form.append('image', blob, 'image.jpg');
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const msg = (data && (data.error as string)) || `upload failed (${res.status})`;
    throw new ApiError(res.status, msg, data?.issues);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>('GET', '/health'),

  // Recipes
  listRecipes: () => request<Recipe[]>('GET', '/recipes'),
  createRecipe: (r: RecipeCreate) => request<Recipe>('POST', '/recipes', r),
  importRecipe: (text: string) => request<Recipe>('POST', '/recipes/import', { text }),
  updateRecipe: (id: string, patch: RecipeUpdate) => request<Recipe>('PUT', `/recipes/${id}`, patch),
  deleteRecipe: (id: string) => request<void>('DELETE', `/recipes/${id}`),
  setRecipeImage: (id: string, file: File) => uploadImage<Recipe>(`/recipes/${id}/image`, file),
  clearRecipeImage: (id: string) => request<Recipe>('DELETE', `/recipes/${id}/image`),

  // Dishes
  listDishes: () => request<Dish[]>('GET', '/dishes'),
  createDish: (d: DishCreate) => request<Dish>('POST', '/dishes', d),
  updateDish: (id: string, patch: DishUpdate) => request<Dish>('PUT', `/dishes/${id}`, patch),
  deleteDish: (id: string) => request<void>('DELETE', `/dishes/${id}`),
  setDishImage: (id: string, file: File) => uploadImage<Dish>(`/dishes/${id}/image`, file),
  clearDishImage: (id: string) => request<Dish>('DELETE', `/dishes/${id}/image`),

  // Menus
  listMenus: () => request<Menu[]>('GET', '/menus'),
  createMenu: (m: MenuCreate) => request<Menu>('POST', '/menus', m),
  updateMenu: (id: string, patch: MenuUpdate) => request<Menu>('PUT', `/menus/${id}`, patch),
  deleteMenu: (id: string) => request<void>('DELETE', `/menus/${id}`),

  // Taxonomy
  listLabels: () => request<DishLabel[]>('GET', '/labels'),
  createLabel: (l: DishLabelCreate) => request<DishLabel>('POST', '/labels', l),
  deleteLabel: (id: string) => request<void>('DELETE', `/labels/${id}`),
  listCategories: () => request<DishCategory[]>('GET', '/categories'),
  createCategory: (c: DishCategoryCreate) => request<DishCategory>('POST', '/categories', c),
  deleteCategory: (id: string) => request<void>('DELETE', `/categories/${id}`),
  listDayLabels: () => request<DayLabel[]>('GET', '/day-labels'),
  createDayLabel: (d: DayLabelCreate) => request<DayLabel>('POST', '/day-labels', d),
  deleteDayLabel: (id: string) => request<void>('DELETE', `/day-labels/${id}`),

  // Meal plan
  listPlan: (from?: string, to?: string) => {
    const qs = from && to ? `?from=${from}&to=${to}` : '';
    return request<MealPlanEntry[]>('GET', `/plan${qs}`);
  },
  createEntry: (e: MealPlanEntryCreate) => request<MealPlanEntry>('POST', '/plan', e),
  updateEntry: (id: string, patch: MealPlanEntryUpdate) => request<MealPlanEntry>('PUT', `/plan/${id}`, patch),
  deleteEntry: (id: string) => request<void>('DELETE', `/plan/${id}`),
};

/**
 * The shape of a Nostimos backend. The remote `api` (above) is the default
 * implementation; `localApi` (local-store.ts) is a browser-only implementation
 * backed by localStorage for standalone / static deployments.
 */
export type Backend = typeof api;
