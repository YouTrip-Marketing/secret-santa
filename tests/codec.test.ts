import { describe, expect, it } from 'vitest';
import {
  LinkError,
  decodeOrganiser,
  decodeReveal,
  encodeOrganiser,
  encodeReveal,
  fromBase64Url,
  newDraw,
  toBase64Url,
} from '../src/lib/codec';
import { derange } from '../src/lib/derange';
import { buildLinks, copyAllText } from '../src/lib/links';

const meta = { group: 'YouTrip Marketing Secret Santa 2026', budget: 'S$30', date: '2026-12-19' };

function makeDraw(names: string[]) {
  return newDraw(names, derange(names.length), meta);
}

describe('base64url', () => {
  it('round-trips arbitrary bytes', () => {
    for (let len = 0; len < 70; len++) {
      const b = crypto.getRandomValues(new Uint8Array(len));
      expect(fromBase64Url(toBase64Url(b))).toEqual(b);
    }
  });
});

describe('reveal links', () => {
  it('round-trips giver, giftee and meta for every person, incl. unicode names', async () => {
    const names = ['Kelicia', 'Cass', 'Sandra', 'Zoë Tan', '陈美玲', 'Ana-María', "D'Souza"];
    const draw = makeDraw(names);
    for (let i = 0; i < names.length; i++) {
      const out = await decodeReveal(await encodeReveal(draw, i));
      expect(out.giver).toBe(names[i]);
      expect(out.giftee).toBe(names[draw.assignment[i]]);
      expect(out.giftee).not.toBe(out.giver);
      expect(out.group).toBe(meta.group);
      expect(out.budget).toBe(meta.budget);
      expect(out.date).toBe(meta.date);
    }
  });

  it('does not expose names in the token', async () => {
    const draw = makeDraw(['Kelicia', 'Cassandra', 'Sandra']);
    const token = await encodeReveal(draw, 0);
    const decodedText = new TextDecoder('latin1').decode(fromBase64Url(token));
    for (const n of draw.names) {
      expect(token.toLowerCase()).not.toContain(n.toLowerCase());
      expect(decodedText).not.toContain(n);
      expect(atobSafe(token)).not.toContain(n);
    }
  });

  it('a reveal payload carries only its own pair', async () => {
    const draw = makeDraw(['A1', 'B2', 'C3', 'D4', 'E5']);
    const out = await decodeReveal(await encodeReveal(draw, 2));
    expect(Object.keys(out).sort()).toEqual(['budget', 'date', 'giftee', 'giver', 'group']);
  });

  it('is deterministic per draw (organiser link regenerates the same links)', async () => {
    const draw = makeDraw(['Amy', 'Ben', 'Cat', 'Dan']);
    const first = await buildLinks(draw, 'https://x.test/secret-santa/');
    const restored = await decodeOrganiser(first.organiser.split('#/o/')[1]);
    const second = await buildLinks(restored, 'https://x.test/secret-santa/');
    expect(second).toEqual(first);
  });

  it('rejects tampered, truncated and wrong-type tokens', async () => {
    const draw = makeDraw(['Amy', 'Ben', 'Cat']);
    const token = await encodeReveal(draw, 0);
    const bytes = fromBase64Url(token);
    bytes[bytes.length - 1] ^= 1;
    await expect(decodeReveal(toBase64Url(bytes))).rejects.toBeInstanceOf(LinkError);
    await expect(decodeReveal(token.slice(0, 20))).rejects.toBeInstanceOf(LinkError);
    await expect(decodeReveal('not a token!')).rejects.toBeInstanceOf(LinkError);
    await expect(decodeReveal(await encodeOrganiser(draw))).rejects.toBeInstanceOf(LinkError);
    await expect(decodeOrganiser(token)).rejects.toBeInstanceOf(LinkError);
  });
});

describe('organiser link', () => {
  it('round-trips the full draw for 50 people', async () => {
    const names = Array.from({ length: 50 }, (_, i) => `Colleague Number ${i + 1}`);
    const draw = makeDraw(names);
    const token = await encodeOrganiser(draw);
    const out = await decodeOrganiser(token);
    expect(out.names).toEqual(names);
    expect(out.assignment).toEqual(draw.assignment);
    expect(out.key).toEqual(draw.key);
    expect(out.nonce).toEqual(draw.nonce);
    expect(token.length).toBeLessThan(1500);
  });
});

describe('copy all', () => {
  it('produces one "Name: link" line per person', async () => {
    const draw = makeDraw(['Amy', 'Ben', 'Cat']);
    const { people } = await buildLinks(draw, 'https://x.test/');
    const lines = copyAllText(people).split('\n');
    expect(lines).toHaveLength(3);
    lines.forEach((l, i) => expect(l.startsWith(`${draw.names[i]}: https://x.test/#/r/`)).toBe(true));
  });
});

function atobSafe(token: string): string {
  try {
    return atob(token.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return '';
  }
}
