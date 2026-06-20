# Agent Guidelines

<!-- freshness: 2026-06-20 -->

**How humans and AI agents work effectively in Nostimos.**

---

## Cold Start / Read Before Coding

Essential reading order (5 minutes):

1. **README.md** — what is this project?
2. **QUICKCONTEXT.md** — what's true right now? (branch, tests, active work)
3. **VERIFY:** run `git log --since='7 days' --oneline | head -20` and cross-check QUICKCONTEXT claims.
4. **TODO.md** — what needs doing?
5. **This file** — how we work together.

### Project context

- **Type:** local-first web app (Svelte 5 SPA + Fastify/SQLite sync server)
- **Tier:** rebar Tier 3 (ENFORCED) — full contract + ground-truth + steward enforcement
- **Toolchain note:** the tool shell does not source rc files; prefix commands needing the toolchain with
  `export PATH="/opt/homebrew/bin:$HOME/.nvm/versions/node/<version>/bin:$PATH"` (Node installed via nvm).

## Contract-Driven Development

**Don't implement without a contract. Don't modify code without checking its contract.**

The four contract principles:

1. **Don't implement without a contract** — write/extend the spec in `architecture/CONTRACT-*.md` first.
2. **Don't modify code without checking its contract** — read the `CONTRACT:` header, then the spec.
3. **Don't update a contract without searching all implementations** — `grep -rn "CONTRACT:<ID>" packages/`.
4. **Contract changes that break interfaces** → plan mode (architect + product + englead).

Every source file under `packages/` declares its contract in the first lines:

```ts
// CONTRACT:S1-API.1.0
```

Tooling/config files that implement no behaviour use `// Architecture: build tooling` instead.
Contracts are indexed in `architecture/CONTRACT-REGISTRY.md` (regenerate with
`scripts/compute-registry.sh`).

## Agent Coordination — the ASK CLI

Use **`ask <role> "<question>"`** for focused, persistent role-based help:

```bash
ask architect "Should the offline write queue reconcile ids client- or server-side?"
ask product   "Is grocery-list integration in v2 scope?"
ask englead   "Are we ready to ship the meal-plan calendar?"
ask steward summary   # automated contract-health check
```

Roles: **architect** (design/contracts), **product** (requirements/scope),
**englead** (delivery/quality), **steward** (automated scanning), **merger** (integration).

## Testing Cascade

Fast inner loops, rigorous outer gates.

| Tier | Name | Command | When |
|------|------|---------|------|
| T0 | Typecheck | `npm run typecheck` | every meaningful edit |
| T1 | Targeted | `vitest run <file>` (in `packages/server`) | every change |
| T2 | Package | `npm test` | before commit |
| T3 | Build | `npm run build` | before push |
| T4 | E2E (manual) | `npm run dev:*` + browser | UI changes |

Server/shared tests run under `NODE_OPTIONS=--experimental-sqlite` (handled by the npm scripts).

### The Scout Rule

Leave the camp cleaner than you found it. Never leave a `skip`ped or failing
test. A skipped test is invisible debt. If a fix would take >30 min and blocks
your task, file a P0 in TODO.md with a deadline — the exception, not the norm.

## TODO Tracking (two-tag system)

- **`TODO:` in code** = untracked = **blocks commit** (caught by `scripts/check-todos.sh`).
- **`TRACKED-TASK:` in code** = tracked in TODO.md = commit allowed.

```ts
// TRACKED-TASK:TODO.md#offline-write-queue queue writes while offline and reconcile ids
```

## Quality Gates

```bash
scripts/check-contract-refs.sh   # contract links valid
scripts/check-todos.sh           # no untracked TODOs
scripts/ci-check.sh              # full Tier 3 enforcement (run before every commit)
```

`scripts/ci-check.sh` runs contract headers/refs, doc refs, TODO tracking,
freshness, registry consistency, ground truth, rebar compliance, decay patterns,
the commit-message gates, and the steward.

## Project-Specific Guidelines

- **Domain model is shared.** Entity shapes + validation live once in
  `packages/shared` (`I1-DOMAIN`). Server and client both import them — never
  redefine a shape locally.
- **One network seam.** All client→server traffic goes through
  `packages/client/src/lib/api.ts` (`C2-API-CLIENT`); all client state goes
  through the store (`C3-STORE`). Views never call `fetch` directly.
- **Local-first reads, server-first writes (v1).** Reads hydrate from the
  `localStorage` cache then refresh; writes require a connection. The offline
  write queue is tracked in TODO.md.
- **SQLite is one file.** `packages/server/data/nostimos.db`. Don't commit it.

## Session Lifecycle

- **Checkpoint** (every ~10 commits / 2 hours): update QUICKCONTEXT.md, commit WIP.
- **End**: update QUICKCONTEXT.md (actual, not aspirational), update TODO.md, regenerate the
  registry/metrics if contracts or counts changed.

---

**Remember:** read the contracts, keep the shared model authoritative, and run
`scripts/ci-check.sh` before committing — Tier 3 means CI will hold the line.
