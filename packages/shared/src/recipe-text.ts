// CONTRACT:I2-RECIPE-IMPORT.1.0
// Parse a plain-text recipe (e.g. an uploaded .txt) into a RecipeCreate input.
// Deterministic + dependency-free so it can run identically on client or server.
import type { RecipeCreate } from './types.js';

/**
 * Heuristic plain-text recipe parser.
 *
 * Conventions recognised (all optional, case-insensitive headers):
 *   - First non-empty line is the title.
 *   - A line equal to "Ingredients" / "Ingredients:" starts the ingredients block.
 *   - A line equal to "Steps" / "Instructions" / "Method" / "Directions" (with
 *     optional trailing colon) starts the steps block.
 *   - A line starting with "Source:" or a bare URL is captured as sourceUrl.
 *   - Text before any recognised header (after the title) is treated as notes.
 */
export function parseRecipeText(raw: string): RecipeCreate {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  let title = '';
  const sections = { notes: [] as string[], ingredients: [] as string[], steps: [] as string[] };
  let sourceUrl: string | null = null;
  let current: keyof typeof sections = 'notes';

  const urlRe = /\bhttps?:\/\/\S+/i;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!title) {
      if (trimmed) title = trimmed;
      continue;
    }

    const header = trimmed.replace(/:$/, '').toLowerCase();
    if (header === 'ingredients') {
      current = 'ingredients';
      continue;
    }
    if (['steps', 'instructions', 'method', 'directions'].includes(header)) {
      current = 'steps';
      continue;
    }

    const sourceMatch = trimmed.match(/^source:\s*(\S.*)$/i);
    if (sourceMatch && sourceMatch[1]) {
      const m = sourceMatch[1].match(urlRe);
      sourceUrl = (m ? m[0] : sourceMatch[1]).trim();
      continue;
    }
    if (!sourceUrl && current === 'notes') {
      const bare = trimmed.match(urlRe);
      if (bare && bare[0] === trimmed) {
        sourceUrl = bare[0];
        continue;
      }
    }

    sections[current].push(line);
  }

  const join = (arr: string[]) => arr.join('\n').trim();

  return {
    title: title || 'Untitled recipe',
    ingredients: join(sections.ingredients),
    steps: join(sections.steps),
    notes: join(sections.notes),
    rating: null,
    sourceUrl,
    image: null,
  };
}
