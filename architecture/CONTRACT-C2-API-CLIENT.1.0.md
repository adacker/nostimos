# CONTRACT-C2-API-CLIENT.1.0

<!-- freshness: 2026-06-20 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Component

## Purpose

The single network seam between the client and the backend. Every request the
browser makes goes through this typed `fetch` wrapper, so the local-first store
(`C3-STORE`) has exactly one place that knows the REST shape and error handling.

## Who needs this

- **`C3-STORE`** — calls `api.*` for all reads and writes.
- Indirectly, every Svelte view via the store.

## Interfaces

```ts
class ApiError extends Error { status: number; issues?: unknown }
const api = {
  health, listRecipes, createRecipe, importRecipe, updateRecipe, deleteRecipe,
  listDishes, createDish, updateDish, deleteDish,
  listMenus, createMenu, updateMenu, deleteMenu,
  listLabels, createLabel, deleteLabel,
  listCategories, createCategory, deleteCategory,
  listDayLabels, createDayLabel, deleteDayLabel,
  listPlan, createEntry, updateEntry, deleteEntry,
}
```

All methods are typed with `@nostimos/shared` (`I1-DOMAIN`) types.

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Base path | All requests prefixed `/api` (Vite proxies to the server in dev) |
| Success | Parses JSON body and returns the typed entity/array |
| `204` | Resolves to `undefined` (no body parse) |
| Failure | Throws `ApiError(status, message, issues)` per `P1-API-PROTOCOL` |
| Network failure | Underlying `fetch` `TypeError` propagates for the store to treat as offline |

## Error Contracts

Non-2xx responses become `ApiError` carrying the server's `error` string and
optional `issues`. Transport failures surface as the native `TypeError` from
`fetch`.

## Implementing Files

The `Backend` type (exported from `api.ts`) is the interface; there are two
implementations selected at build time by the store (`VITE_BACKEND`):

- `packages/client/src/lib/api.ts` — remote implementation (`fetch` over REST) + the `Backend` type
- `packages/client/src/lib/local-store.ts` — browser-only implementation backed by `localStorage`
  (used for the standalone / static here.now build; single device, no sync)

## Test Requirements

- [ ] Envelope-to-`ApiError` mapping (deferred — see TODO.md client-tests)
- [ ] `204` resolves to `undefined`

Validated indirectly today via the end-to-end proxy check; dedicated unit tests
are tracked in TODO.md.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial typed API client | — |
