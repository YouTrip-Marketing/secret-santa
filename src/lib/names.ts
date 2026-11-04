export const MIN_PEOPLE = 3;
export const MAX_PEOPLE = 100;
export const MAX_NAME_LENGTH = 40;

export type NamesResult = { ok: true; names: string[] } | { ok: false; error: string };

/** Parses one-name-per-line input. Blank lines are ignored; whitespace is collapsed. */
export function parseNames(raw: string): NamesResult {
  const names = raw
    .split(/\r?\n/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0);

  if (names.length < MIN_PEOPLE) return { ok: false, error: `Add at least ${MIN_PEOPLE} names.` };
  if (names.length > MAX_PEOPLE) return { ok: false, error: `Maximum ${MAX_PEOPLE} names.` };

  const tooLong = names.find((n) => n.length > MAX_NAME_LENGTH);
  if (tooLong) return { ok: false, error: `"${tooLong.slice(0, 20)}…" is too long (max ${MAX_NAME_LENGTH} characters).` };

  const seen = new Map<string, string>();
  const dupes = new Set<string>();
  for (const n of names) {
    const key = n.toLocaleLowerCase();
    if (seen.has(key)) dupes.add(seen.get(key)!);
    else seen.set(key, n);
  }
  if (dupes.size > 0) {
    return { ok: false, error: `Duplicate name${dupes.size > 1 ? 's' : ''}: ${[...dupes].join(', ')}. Add a surname or initial.` };
  }
  return { ok: true, names };
}
