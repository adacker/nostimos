# CONTRACT-S1-API.1.0

<!-- freshness: 2026-06-20 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Service

## Purpose

The Fastify HTTP service that exposes Nostimos data to the client and is the
sync point for the whole family. It owns the REST surface for recipes, dishes,
menus, taxonomy (labels/categories/day-labels), and the meal plan, delegating
persistence to `S2-STORAGE` and validation to `I1-DOMAIN`.

## Who needs this

- **`@nostimos/client`** (`C2-API-CLIENT`) — sole consumer of the REST API.
- **`S2-STORAGE`** — invoked by every handler.

## Interfaces

REST under `/api` (see `P1-API-PROTOCOL` for the request/response envelope):

```
GET    /api/health
GET    /api/recipes            POST /api/recipes        POST /api/recipes/import
GET    /api/recipes/:id        PUT  /api/recipes/:id    DELETE /api/recipes/:id
GET/POST/PUT/DELETE            /api/dishes[/:id]
GET/POST/PUT/DELETE            /api/menus[/:id]
GET/POST/DELETE               /api/labels[/:id]  /api/categories[/:id]  /api/day-labels[/:id]
GET    /api/plan?from&to       POST /api/plan   PUT /api/plan/:id   DELETE /api/plan/:id
```

`buildApp({ dbPath?, store?, logger? })` returns a Fastify instance for serving or `inject()` testing.

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Create | `201` with the created entity |
| Delete | `204` with empty body |
| Missing id | `404 { error }` |
| Invalid body | `400 { error, issues }` (delegated to `P1-API-PROTOCOL`) |
| Plan target rule | Rejects an entry referencing both / neither dish and menu (`400`) |
| `/api/recipes/import` | Parses text via `I2-RECIPE-IMPORT`, then creates |
| CORS | Enabled (`origin: true`) for local-first cross-port dev |

## Error Contracts

All failures use the uniform envelope from `P1-API-PROTOCOL`:
`{ error: string, issues?: ZodIssue[] }` with status `400` (validation) or
`404` (missing). Unhandled errors fall through to Fastify's default `500`.

## Implementing Files

- `packages/server/src/app.ts` — app builder + route wiring
- `packages/server/src/index.ts` — process entrypoint
- `packages/server/src/routes/recipes.ts`, `dishes.ts`, `menus.ts`, `taxonomy.ts`, `plan.ts`

## Test Requirements

- [x] Health check
- [x] Recipe create + list
- [x] Validation 400 envelope
- [x] Text import endpoint
- [x] 404 for missing
- [x] Plan dual-reference rejected
- [x] Plan create + date-range list

Tests: `packages/server/test/api.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial REST API (v1 scope) | — |
