# CONTRACT-C1-APP.1.0

<!-- freshness: 2026-06-28 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Component

## Purpose

The client shell: mounts the Svelte app, presents the top-level tab navigation
(Plan, Recipes, Dishes, Menus, Settings), surfaces sync status, and triggers the
initial `store.refresh()`. It's the composition root that wires the views to the
local-first store (`C3-STORE`).

## Who needs this

- The browser entrypoint (`index.html` → `main.ts`).
- Hosts the feature views, each of which reads `C3-STORE`.

## Interfaces

```ts
// main.ts
mount(App, { target: #app })
// App.svelte: tab state + <PlanView|RecipesView|DishesView|MenusView|SettingsView/>
```

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Mount | Throws if `#app` is absent |
| On mount | Calls `store.refresh()` once |
| Sync indicator | Shows synced / syncing / offline from store status |
| Offline banner | Shown when `!online` and there is a `lastError` |
| Tab routing | Renders exactly one feature view at a time |
| Cover images | Recipe + dish cards show a cover image when set; their forms offer a file picker with live preview and a remove action (upload happens on save via `C3-STORE`) |

## Error Contracts

Rendering errors are local to a view; the shell itself only guards the mount
point. Sync/transport errors are reflected (not thrown) via the store's status
fields.

## Implementing Files

- `packages/client/src/main.ts` — mount
- `packages/client/src/App.svelte` — shell + tabs
- `packages/client/src/lib/components/*.svelte` — feature views

## Test Requirements

- [ ] Mount guard throws without `#app` (deferred — see TODO.md client-tests)
- [ ] Tab switching renders the selected view

Verified manually today via the dev server; component tests are tracked in TODO.md.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial app shell + 5 views | — |
| 1.0 | 2026-06-28 | Recipe + dish cards/forms show and edit a cover image | Additive |
