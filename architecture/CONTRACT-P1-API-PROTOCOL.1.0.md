# CONTRACT-P1-API-PROTOCOL.1.0

<!-- freshness: 2026-06-20 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Protocol

## Purpose

The wire conventions shared by every Nostimos endpoint: JSON bodies, a uniform
error envelope, and consistent status codes. Centralising this keeps the client
(`C2-API-CLIENT`) able to handle any endpoint's success and failure the same
way, and gives `S1-API` route modules one validation seam.

## Who needs this

- **`S1-API`** route modules — call `parseBody` / `notFound` for a consistent shape.
- **`C2-API-CLIENT`** — parses the envelope and raises `ApiError` on failure.

## Interfaces

```ts
interface ApiError { error: string; issues?: unknown }
parseBody<S>(schema: S, data: unknown, reply): z.infer<S> | undefined  // 400 on failure
notFound(reply, what?): ApiError                                        // sets 404
```

Request bodies are `application/json`. Successful reads/writes return the entity
(or array) as JSON; deletes return `204` with no body.

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Validation failure | `400 { error: 'validation failed', issues: ZodIssue[] }` |
| Missing resource | `404 { error: '<thing> not found' }` |
| No content | `204` empty body (deletes) |
| Content type | JSON in, JSON out (except `204`) |

## Error Contracts

| Error | When | Status |
|-------|------|--------|
| validation failed | body fails its zod schema | 400 |
| not found | id does not resolve | 404 |

## Implementing Files

- `packages/server/src/routes/http.ts` — `parseBody`, `notFound`, `ApiError`
- `packages/client/src/lib/api.ts` — client-side envelope handling (`ApiError`)

## Test Requirements

- [x] 400 envelope carries `error` + `issues[]`
- [x] 404 envelope carries `error` containing "not found"

Tests: `packages/server/test/api.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial protocol envelope | — |
