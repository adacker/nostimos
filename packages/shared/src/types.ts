// CONTRACT:I1-DOMAIN.1.0
// Shared domain model for Nostimos: the single source of truth for entity
// shapes and validation, consumed by both @nostimos/server and @nostimos/client.
import { z } from 'zod';

// ── Primitives ──────────────────────────────────────────────────────────────

/** ISO-8601 date-time string, e.g. "2026-06-20T17:44:00.000Z". */
export const isoDateTime = z.string().datetime();
/** Calendar date in YYYY-MM-DD form (the unit a meal plan is keyed by). */
export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

/** The two meal slots Nostimos plans for in v1. */
export const MealSlot = z.enum(['lunch', 'dinner']);
export type MealSlot = z.infer<typeof MealSlot>;

/** 0 = Sunday … 6 = Saturday (matches JS Date.getDay()). */
export const Weekday = z.number().int().min(0).max(6);

const rating = z.number().int().min(1).max(5).nullable();

// ── Entities ────────────────────────────────────────────────────────────────

export const DishLabel = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
});
export type DishLabel = z.infer<typeof DishLabel>;

export const DishCategory = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
});
export type DishCategory = z.infer<typeof DishCategory>;

export const Recipe = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  ingredients: z.string().default(''),
  steps: z.string().default(''),
  notes: z.string().default(''),
  rating,
  sourceUrl: z.string().url().nullable(),
  /**
   * Cover image as a URL the UI renders directly. Server (remote) mode stores a
   * served path like "/api/uploads/<file>"; browser-local mode stores a `data:`
   * URL. Plain string (not `.url()`) so both relative paths and data URLs pass.
   */
  image: z.string().nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Recipe = z.infer<typeof Recipe>;

export const Dish = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  categoryId: z.string().uuid().nullable(),
  labelIds: z.array(z.string().uuid()).default([]),
  /** Multiple recipe options may satisfy one dish. */
  recipeIds: z.array(z.string().uuid()).default([]),
  notes: z.string().default(''),
  /** Cover image URL; same dual-mode convention as Recipe.image. */
  image: z.string().nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Dish = z.infer<typeof Dish>;

export const Menu = z.object({
  id: z.string().uuid(),
  /** A menu name is optional; empty string means "unnamed". */
  name: z.string().max(120).default(''),
  /** One or more dishes compose a menu. */
  dishIds: z.array(z.string().uuid()).default([]),
  notes: z.string().default(''),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Menu = z.infer<typeof Menu>;

export const MealPlanEntry = z
  .object({
    id: z.string().uuid(),
    date: calendarDate,
    slot: MealSlot,
    /** Exactly one of dishId / menuId is set. */
    dishId: z.string().uuid().nullable(),
    menuId: z.string().uuid().nullable(),
    notes: z.string().default(''),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .refine((e) => (e.dishId === null) !== (e.menuId === null), {
    message: 'a plan entry must reference exactly one of dishId or menuId',
  });
export type MealPlanEntry = z.infer<typeof MealPlanEntry>;

export const DayLabel = z.object({
  id: z.string().uuid(),
  /** Persistent weekday suggestion, e.g. Tuesday → "Taco Tuesday". */
  weekday: Weekday,
  label: z.string().min(1).max(60),
  createdAt: isoDateTime,
});
export type DayLabel = z.infer<typeof DayLabel>;

// ── Create / update inputs (server assigns id + timestamps) ──────────────────

const omitMeta = { id: true, createdAt: true, updatedAt: true } as const;

export const RecipeCreate = Recipe.omit(omitMeta);
export const RecipeUpdate = RecipeCreate.partial();
export type RecipeCreate = z.infer<typeof RecipeCreate>;
export type RecipeUpdate = z.infer<typeof RecipeUpdate>;

export const DishCreate = Dish.omit(omitMeta);
export const DishUpdate = DishCreate.partial();
export type DishCreate = z.infer<typeof DishCreate>;
export type DishUpdate = z.infer<typeof DishUpdate>;

export const MenuCreate = Menu.omit(omitMeta);
export const MenuUpdate = MenuCreate.partial();
export type MenuCreate = z.infer<typeof MenuCreate>;
export type MenuUpdate = z.infer<typeof MenuUpdate>;

export const MealPlanEntryCreate = z.object({
  date: calendarDate,
  slot: MealSlot,
  dishId: z.string().uuid().nullable().default(null),
  menuId: z.string().uuid().nullable().default(null),
  notes: z.string().default(''),
});
export const MealPlanEntryUpdate = MealPlanEntryCreate.partial();
export type MealPlanEntryCreate = z.infer<typeof MealPlanEntryCreate>;
export type MealPlanEntryUpdate = z.infer<typeof MealPlanEntryUpdate>;

export const DishLabelCreate = DishLabel.omit({ id: true });
export const DishCategoryCreate = DishCategory.omit({ id: true });
export const DayLabelCreate = DayLabel.omit({ id: true, createdAt: true });
export type DishLabelCreate = z.infer<typeof DishLabelCreate>;
export type DishCategoryCreate = z.infer<typeof DishCategoryCreate>;
export type DayLabelCreate = z.infer<typeof DayLabelCreate>;
