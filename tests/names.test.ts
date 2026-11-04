import { describe, expect, it } from 'vitest';
import { parseNames } from '../src/lib/names';
import { countdownTo, parseLocalDate } from '../src/lib/date';

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

describe('countdown', () => {
  it('counts down to local midnight of the date', () => {
    const c = countdownTo('2026-12-19', new Date(2026, 11, 17, 22, 30, 15));
    expect(c).toEqual({ state: 'before', days: 1, hours: 1, minutes: 29, seconds: 45 });
  });
  it('is "today" during the day and "after" once it passes', () => {
    expect(countdownTo('2026-12-19', new Date(2026, 11, 19, 15))?.state).toBe('today');
    expect(countdownTo('2026-12-19', new Date(2026, 11, 20, 0, 0, 1))?.state).toBe('after');
  });
  it('rejects invalid dates', () => {
    expect(parseLocalDate('2026-02-31')).toBeNull();
    expect(countdownTo('', new Date())).toBeNull();
  });
});
