# CONTRACT-I1-DOMAIN.1.0

<!-- freshness: 2026-06-28 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Data Model

## Purpose

The shared domain model for Nostimos — recipes, dishes, labels, categories,
menus, meal-plan entries, and day labels. It is the single source of truth for
entity shapes and validation, imported identically by the server and the client
so both sides agree on what a "dish" or a "meal plan entry" is.

## Who needs this

- **`@nostimos/server`** — validates request bodies and shapes DB rows against these schemas.
- **`@nostimos/client`** (`C2-API-CLIENT`, `C3-STORE`) — types its API calls and local cache.

## Interfaces

Zod schemas with inferred TypeScript types, exported from `packages/shared/src/types.ts`:

```ts
Recipe        { id, title, ingredients, steps, notes, rating: 1..5|null, sourceUrl: url|null, image: string|null, createdAt, updatedAt }
Dish          { id, name, categoryId|null, labelIds[], recipeIds[], notes, image: string|null, createdAt, updatedAt }
DishLabel     { id, name, color: #rrggbb|null }
DishCategory  { id, name }
Menu          { id, name, dishIds[], notes, createdAt, updatedAt }
MealPlanEntry { id, date: YYYY-MM-DD, slot: 'lunch'|'dinner', dishId|null, menuId|null, notes, ... }
DayLabel      { id, weekday: 0..6, label, createdAt }
```

`*Create` / `*Update` companion schemas omit server-assigned fields (`id`, timestamps).

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Recipe `rating` | Integer 1–5 or `null`; out-of-range rejected |
| `MealPlanEntry` target | Exactly one of `dishId` / `menuId` is non-null (`.refine`) |
| `date` fields | Must match `^\d{4}-\d{2}-\d{2}$` |
| `*Create` defaults | Optional string fields default to `''`, arrays to `[]` |
| `Menu.name` | Optional; empty string means "unnamed" |
| `Recipe`/`Dish` `image` | Cover-image URL or `null` (default). A served path (`/api/uploads/…`) in remote mode or a `data:` URL in browser-local mode; plain string, not `.url()`, so both pass. Set via dedicated `C2-API-CLIENT` upload methods, not a plain field edit. |

## Error Contracts

Validation failures surface as `ZodError.issues`; the API layer (`P1-API-PROTOCOL`)
renders them as a `400 { error, issues }` envelope. The domain layer itself
throws no custom error types.

## Implementing Files

- `packages/shared/src/types.ts` — schemas + types
- `packages/shared/src/index.ts` — public surface

## Test Requirements

- [x] Rating bounds enforced
- [x] Exactly-one-of dish/menu enforced
- [x] Calendar-date format enforced
- [x] Create-schema defaults applied

Tests: `packages/server/test/domain.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial domain model (v1 scope: recipes, dishes, menus, plan) | — |
| 1.0 | 2026-06-28 | Added nullable `image` cover field to `Recipe` and `Dish` | Additive; defaults to `null`, existing data unaffected |
