/** Uniform random integer in [0, max) using the platform CSPRNG with rejection sampling (no modulo bias). */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be a positive integer');
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/** Fisher-Yates shuffle of [0..n). */
function shuffledIndices(n: number, rand: (max: number) => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a derangement of [0..n): result[i] is the giftee index for giver i, and result[i] !== i.
 * Rejection sampling over uniform permutations gives a uniform derangement (expected ~e tries).
 */
export function derange(n: number, rand: (max: number) => number = randomInt): number[] {
  if (!Number.isInteger(n) || n < 2) throw new RangeError('Need at least 2 people');
  for (;;) {
    const p = shuffledIndices(n, rand);
    if (p.every((v, i) => v !== i)) return p;
  }
}
