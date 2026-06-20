# CONTRACT-S2-STORAGE.1.0

<!-- freshness: 2026-06-20 -->

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

Tests: `packages/server/test/storage.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial node:sqlite store | — |
