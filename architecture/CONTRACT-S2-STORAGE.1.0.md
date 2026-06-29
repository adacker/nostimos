# CONTRACT-S2-STORAGE.1.0

<!-- freshness: 2026-06-28 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Service

## Purpose

Durable, local persistence for all Nostimos data using Node's built-in
`node:sqlite`. A single SQLite file holds the family's recipes, dishes, menus,
and meal plans so data survives restarts and can be backed up by copying one
file. Exposed as a typed, synchronous `Store` whose methods return shared
domain types.

## Who needs this

- **`S1-API`** — every route handler reads/writes through a `Store` instance.
- **Tests** — construct an in-memory `Store(':memory:')` for isolation.

## Interfaces

```ts
class Store {
  constructor(path?: string) // ':memory:' default
  // recipes / dishes / menus / plan entries: list, get, create, update, delete
  // labels / categories / day labels: list, create, delete
  // listEntries(from?, to?) filters a meal-plan date range
  close(): void
}
```

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| `create*` | Assigns `randomUUID()` id and equal `createdAt`/`updatedAt` |
| `update*` | Merges patch over existing, bumps `updatedAt`; returns `undefined` if missing |
| `delete*` | Returns `true` if a row was removed, `false` otherwise |
| Array fields | `labelIds`/`recipeIds`/`dishIds` stored as JSON text, parsed on read |
| `listEntries(from,to)` | Inclusive date range; no args returns all |
| Ordering | Recipes/dishes/menus listed by name/title, `NOCASE` |
| `image` column | Nullable `TEXT` on `recipes` and `dishes`; holds the cover URL only (image bytes live as files, not in the DB) |
| Schema migration | Constructor idempotently `ALTER TABLE … ADD COLUMN` for columns (e.g. `image`) introduced after a DB was first created |

## Error Contracts

Missing rows are represented as `undefined` (reads) or `false` (deletes), never
exceptions. SQLite constraint violations propagate as native errors to the
caller (the API layer maps unexpected errors to `500`).

## Implementing Files

- `packages/server/src/db.ts` — schema + `Store`

## Test Requirements

- [x] Create/read round-trip with assigned id + timestamps
- [x] JSON array fields round-trip
- [x] Update bumps `updatedAt`
- [x] Missing-row reads/deletes return `undefined`/`false`
- [x] Date-range filtering
- [x] `image` persists and clears on recipes
- [x] Pre-`image` database migrates without data loss

Tests: `packages/server/test/storage.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial node:sqlite store | — |
| 1.0 | 2026-06-28 | Added `image` column to `recipes`/`dishes` + idempotent column migration | Auto-applied on open; existing rows get `image = NULL` |
