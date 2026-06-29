# Quick Context

<!-- freshness: 2026-06-28 -->
<!-- last-synced: 2026-06-28 -->

**Current state of the project.**

## What is this

Nostimos — local-first family meal planning. Svelte 5 SPA (`packages/client`)
+ Fastify/`node:sqlite` sync server (`packages/server`) + shared zod domain
model (`packages/shared`). rebar Tier 3 (ENFORCED).

## What's done (v1 foundation)

- Monorepo + toolchain (Node 24 via nvm, Homebrew, jq) installed and wired.
- **Server:** REST API for recipes, dishes, menus, taxonomy, meal plan over SQLite. 25 tests passing.
- **Client:** Recipes (with `.txt` import + ratings), Dishes, Menus, Settings, and a
  week/month meal-plan calendar with day labels. Builds clean (0 errors), ~40 KB gzipped.
- **Cover images (2026-06-28):** recipes + dishes carry a `Recipe.image`/`Dish.image` URL.
  Hybrid storage — remote mode uploads to `data/uploads/` via `@fastify/multipart`/`@fastify/static`
  (served at `/api/uploads/*`); browser-local mode inlines a `data:` URL. Client compresses
  (canvas → JPEG ≤1280px) before upload in both modes. CI green (12/12), Tier 3 enforced.
- **Contracts:** 8 contracts in `architecture/`, doubly-linked to code, registry computed.
- End-to-end verified: client → Vite proxy → server → SQLite (incl. image upload/serve/clear).

## What's Next (priority order)

1. Client-side unit tests (`C1-APP`, `C2-API-CLIENT`, `C3-STORE`) — see TODO.md#client-tests.
2. Offline write queue with id reconciliation — see TODO.md#offline-write-queue.
3. Next feature milestone: pantry/inventory + grocery lists (was deferred from v1).

## Active Work

**In progress:** v1 foundation complete; first commit pending.

## Branch & State

- **Active branch:** main
- **Run:** `npm run dev:server` + `npm run dev:client`, open http://localhost:5173
- **Enforce:** `npm run ci` (scripts/ci-check.sh)
