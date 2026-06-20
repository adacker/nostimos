# CONTRACT-I2-RECIPE-IMPORT.1.0

<!-- freshness: 2026-06-20 -->

**Version:** 1.0
**Status:** active
**Owner:** nostimos
**Type:** Interface

## Purpose

Turn a plain-text recipe (a pasted blob or an uploaded `.txt`) into a structured
`RecipeCreate`. Families accumulate recipes as text from websites, notes apps,
and messages; this lets them bring those in without manual re-entry.

## Who needs this

- **`@nostimos/client`** Recipes view — "Import .txt" flow.
- **`@nostimos/server`** — `POST /api/recipes/import` reuses the same parser so client and server agree.

## Interfaces

```ts
function parseRecipeText(raw: string): RecipeCreate
```

Deterministic and dependency-free; runs identically on client and server.

## Behavioral Contracts

| Behavior | Specification |
|----------|--------------|
| Title | First non-empty line becomes the title |
| Empty input | Title falls back to `"Untitled recipe"` |
| `Ingredients` header | Lines until next header collected into `ingredients` |
| Step headers | `Steps`/`Instructions`/`Method`/`Directions` (optional `:`) start `steps` |
| Source | `Source:` line or a bare URL becomes `sourceUrl` |
| Pre-header body | Text after the title but before any header becomes `notes` |
| Rating | Always `null` on import (rated later by hand) |

## Error Contracts

Total function — never throws. Unrecognised structure degrades gracefully into
`notes`. The resulting object still passes `RecipeCreate` validation.

## Implementing Files

- `packages/shared/src/recipe-text.ts` — the parser
- `packages/shared/src/index.ts` — re-export
- `packages/server/src/routes/recipes.ts` — `/api/recipes/import` consumer

## Test Requirements

- [x] Title extraction (incl. leading blank lines)
- [x] Ingredients/steps splitting
- [x] Alternate step headers recognised
- [x] `Source:` line and bare URL captured
- [x] Empty-input fallback

Tests: `packages/server/test/recipe-import.test.ts`.

## Change History

| Version | Date | Change | Migration |
|---------|------|--------|-----------|
| 1.0 | 2026-06-20 | Initial heuristic text importer | — |
