import { describe, expect, it } from 'vitest';
import { derange, randomInt } from '../src/lib/derange';

describe('derange', () => {
  it('never self-assigns and is always a permutation, n = 3..50', () => {
    for (let n = 3; n <= 50; n++) {
      for (let trial = 0; trial < 200; trial++) {
        const p = derange(n);
        expect(p).toHaveLength(n);
        expect(new Set(p).size).toBe(n);
        p.forEach((v, i) => {
          expect(v).not.toBe(i);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(n);
        });
      }
    }
  });

  it('is roughly uniform over derangements (n = 4 has 9)', () => {
    const counts = new Map<string, number>();
    const trials = 90_000;
    for (let t = 0; t < trials; t++) {
      const k = derange(4).join('');
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    for (const c of counts.values()) {
      expect(c).toBeGreaterThan(trials / 9 * 0.93);
      expect(c).toBeLessThan(trials / 9 * 1.07);
    }
  });

  it('n = 3 only ever produces the two 3-cycles', () => {
    const seen = new Set<string>();
    for (let t = 0; t < 2000; t++) seen.add(derange(3).join(''));
    expect([...seen].sort()).toEqual(['120', '201']);
  });

  it('rejects n < 2', () => {
    expect(() => derange(1)).toThrow();
    expect(() => derange(0)).toThrow();
  });

  it('randomInt stays in range', () => {
    for (let i = 0; i < 10_000; i++) {
      const r = randomInt(7);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(7);
    }
  });
});
