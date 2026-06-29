# CONTRACT-C2-API-CLIENT.1.0

<!-- freshness: 2026-06-28 -->

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
  setRecipeImage, clearRecipeImage,
  listDishes, createDish, updateDish, deleteDish, setDishImage, clearDishImage,
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
| Image upload | `set{Recipe,Dish}Image(id, file)` compresses the `File` in-browser (`image.ts`, canvas → JPEG ≤ 1280px), then **remote**: POSTs it as multipart to `:id/image`; **local**: inlines it as a `data:` URL. Both resolve to the updated entity. `clear*Image(id)` removes it. |

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
- `packages/client/src/lib/image.ts` — shared in-browser image compression (canvas) used by both
  implementations before an upload, so remote (multipart) and local (`data:` URL) produce small covers

## Test Requirements

- [ ] Envelope-to-`ApiError` mapping (deferred — see TODO.md client-tests)
- [ ] `204` resolves to `undefined`

Validated indirectly today via the end-to-end proxy check; dedicated unit tests
are tracked in TODO.md.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial typed API client | — |
| 1.0 | 2026-06-28 | Added `set/clear` image methods (both impls) + in-browser compression helper | Additive to the `Backend` interface |
