// CONTRACT:I2-RECIPE-IMPORT.1.0
import { describe, it, expect } from 'vitest';
import { parseRecipeText } from '@nostimos/shared';

describe('parseRecipeText (I2-RECIPE-IMPORT)', () => {
  it('uses the first non-empty line as the title', () => {
    const r = parseRecipeText('\n\nMoussaka\nlayered aubergine bake');
    expect(r.title).toBe('Moussaka');
  });

  it('splits ingredients and steps under their headers', () => {
    const r = parseRecipeText(['Pastitsio', 'Ingredients', 'pasta', 'beef', 'Steps', 'boil', 'bake'].join('\n'));
    expect(r.ingredients).toBe('pasta\nbeef');
    expect(r.steps).toBe('boil\nbake');
  });

  it('recognises Instructions / Method / Directions as step headers', () => {
    for (const header of ['Instructions', 'Method', 'Directions:']) {
      const r = parseRecipeText(`Dish\n${header}\ndo the thing`);
      expect(r.steps).toBe('do the thing');
    }
  });

  it('captures a Source: line and a bare URL as sourceUrl', () => {
    expect(parseRecipeText('X\nSource: https://a.test/r').sourceUrl).toBe('https://a.test/r');
    expect(parseRecipeText('X\nhttps://b.test/r').sourceUrl).toBe('https://b.test/r');
  });

  it('falls back to a placeholder title for empty input', () => {
    expect(parseRecipeText('   ').title).toBe('Untitled recipe');
  });
});
