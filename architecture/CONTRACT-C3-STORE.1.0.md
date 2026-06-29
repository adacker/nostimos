# CONTRACT-C3-STORE.1.0

<!-- freshness: 2026-06-28 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Component

## Purpose

The local-first application state for the client. It hydrates instantly from a
`localStorage` cache so the UI is usable before the network responds, then
refreshes from the backend (`C2-API-CLIENT`) and keeps the two in sync. This is
what makes Nostimos feel instant on every family member's device while a shared
server remains the source of truth.

## Who needs this

- Every Svelte view (`C1-APP` and its children) reads reactive collections and calls mutators here.

## Interfaces

```ts
// Svelte 5 runes singleton
store.recipes / dishes / menus / labels / categories / dayLabels / plan  // $state arrays
store.online / syncing / lastError / lastSyncedAt                        // status
store.refresh()                                                          // pull all
store.add*/edit*/remove* (recipes, dishes, menus, labels, categories, dayLabels, entries)
store.set{Recipe,Dish}Image(id, file) / clear{Recipe,Dish}Image(id)         // cover images
store.recipeById / dishById / menuById / labelById / categoryById
```

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Hydration | Constructor loads the `nostimos-cache-v1` snapshot synchronously |
| `refresh()` | Pulls every collection, replaces state, re-caches, sets `lastSyncedAt` |
| Mutations | Server-first; on success update in-memory state + cache |
| Offline read | Cached data remains visible when the server is unreachable |
| Error surface | `lastError` set on failure; `online=false` on transport (`TypeError`) failure |
| Sorting | Recipes by title, dishes/labels/categories by name |
| Image mutators | `set/clear*Image` go through the same server-first `run()` path as other writes; the returned entity (with new `image`) replaces the item in state + cache |

## Error Contracts

Mutators never throw to the caller; they record `lastError` and return
`undefined` on failure so views can stay responsive. A network `TypeError`
flips `online` to `false`.

## Future evolution

v1 writes are server-first (a connection is required to persist). An offline
write queue with id reconciliation is a tracked enhancement — see TODO.md
(`offline-write-queue`). The cache key is versioned (`-v1`) to allow a future
schema migration.

## Implementing Files

- `packages/client/src/lib/store.svelte.ts`

## Test Requirements

- [ ] Hydration from cache (deferred — see TODO.md client-tests)
- [ ] Mutation updates state + cache on success
- [ ] Offline mutation sets `lastError` without throwing

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial local-first store | — |
| 1.0 | 2026-06-28 | Added `set/clear` image mutators for recipes + dishes | Additive |
