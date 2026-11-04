import { describe, expect, it } from 'vitest';
import { parseNames } from '../src/lib/names';

describe('parseNames', () => {
  it('trims, collapses spaces and drops blank lines', () => {
    expect(parseNames('  Amy  \n\n Ben   Lee\r\nCat\n   ')).toEqual({ ok: true, names: ['Amy', 'Ben Lee', 'Cat'] });
  });
  it('requires at least 3', () => {
    expect(parseNames('Amy\nBen').ok).toBe(false);
    expect(parseNames('').ok).toBe(false);
  });
  it('flags case-insensitive duplicates', () => {
    const r = parseNames('Amy\namy\nBen\nCat');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Amy');
  });
});
