# Nostimos

> **rebar v2.0.0** | **Tier 3: ENFORCED** | [What is rebar?](https://github.com/willackerly/rebar)

<!-- freshness: 2026-06-20 -->

**A local-first family meal-planning app** — keep a recipe book, organise dishes
and menus, and plan the week or month on a calendar. The app runs in the browser
(TypeScript compiled to client-side JS) and syncs to a small local server so the
whole family shares the same plan across devices.

_Nostimos_ (νόστιμος) is Greek for "tasty".

---

## What it does (v1)

- **Recipe book** — recipes with ingredients, steps, notes, a 1–5 rating, and an
  inspiration link. Import a recipe from a pasted blob or a `.txt` file.
- **Dishes** — a named dish (e.g. _Tacos al Pastor_) with a category
  (tacos, pasta, rice bowl…), cuisine labels (Italian, Tex-Mex, Greek…), and one
  or more recipe options.
- **Menus** — an optionally-named menu bundling one or more dishes.
- **Meal plan** — a week/month calendar with lunch & dinner slots; assign a dish
  or a menu to any slot. Persistent weekday labels (e.g. _Taco Tuesday_) show as
  suggestions.

Pantry/inventory, grocery lists, cook mode, and family meal requests are planned
for later milestones — see [TODO.md](TODO.md).

## Architecture

A npm-workspace monorepo:

| Package | What |
|---------|------|
| `packages/shared` | Domain model + zod schemas (the contract IR), shared by both sides |
| `packages/server` | Fastify REST API over `node:sqlite` (single local DB file) |
| `packages/client` | Svelte 5 + Vite SPA with a local-first store (instant cached reads, server sync) |

Behaviour is specified as **rebar contracts** in [architecture/](architecture/)
and linked from source via `CONTRACT:` headers.

## Getting started

Requires Node ≥ 22.5 (for the built-in `node:sqlite`).

```bash
npm install

# run the API (http://127.0.0.1:3001) and the client (http://localhost:5173)
npm run dev:server      # terminal 1
npm run dev:client      # terminal 2
# then open http://localhost:5173
```

Other commands:

```bash
npm test           # server + shared test suites (vitest)
npm run typecheck  # tsc / svelte-check across packages
npm run build      # production build of all packages
npm run ci         # rebar Tier 3 enforcement (scripts/ci-check.sh)
```

The database lives at `packages/server/data/nostimos.db` (override with
`NOSTIMOS_DB`). Backing up the family's data is just copying that file.

## Working in this repo

1. [QUICKCONTEXT.md](QUICKCONTEXT.md) — current state
2. [TODO.md](TODO.md) — active work and roadmap
3. [AGENTS.md](AGENTS.md) — how humans and agents work here
4. [architecture/](architecture/) — contract specifications
5. [METRICS](METRICS) — ground-truth numbers verified by CI
