# TODO

<!-- last-synced: 2026-06-20 -->

Active tasks only. Priorities live in QUICKCONTEXT.md "What's Next."

## Open Items

### client-tests
- [ ] Add client unit tests for `C2-API-CLIENT` (envelope → `ApiError`, `204` → `undefined`)
      and `C3-STORE` (cache hydration, mutation updates state+cache, offline sets `lastError`),
      plus a mount/tab smoke test for `C1-APP`. Wire a `vitest` (jsdom) project under `packages/client`.

### offline-write-queue
- [ ] `C3-STORE` writes are server-first today. Add an offline queue that records
      mutations while disconnected and reconciles server-assigned ids on reflush,
      so the app is fully usable offline (true local-first writes).

### next-milestone
- [ ] Pantry / fridge / freezer inventory + grocery lists (deferred from v1 scope).
- [ ] Cook mode: step/ingredient check-off, cook photos, ratings.
- [ ] Family meal requests.

## Known Issues & Blockers

- `npm audit` reports advisories in the dev dependency tree (Vite/tooling). Triage before any deploy.

<details>
<summary><strong>Completed</strong></summary>

- [x] REBAR bootstrap — 2026-06-20
- [x] Dev environment (Homebrew, Node 24 via nvm, jq) — 2026-06-20
- [x] Monorepo scaffold (shared/server/client) — 2026-06-20
- [x] Server: SQLite store + Fastify REST API + 21 tests — 2026-06-20
- [x] Client: Svelte 5 SPA (recipes/dishes/menus + meal-plan calendar) — 2026-06-20
- [x] 8 rebar contracts + registry — 2026-06-20

</details>
