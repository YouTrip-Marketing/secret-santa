import { describe, expect, it } from 'vitest';
import {
  LinkError,
  decodeGroup,
  decodeOrganiser,
  drawId,
  encodeGroup,
  isValidAssignment,
  decodeReveal,
  encodeOrganiser,
  encodeReveal,
  fromBase64Url,
  newDraw,
  toBase64Url,
} from '../src/lib/codec';
import { derange } from '../src/lib/derange';
import { buildLinks, copyAllText, groupMessage } from '../src/lib/links';

const meta = { group: 'YouTrip Marketing Secret Santa 2026', budget: 'S$30' };

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
    expect(Object.keys(out).sort()).toEqual(['budget', 'giftee', 'giver', 'group']);
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

describe('legacy tokens with an exchange date', () => {
  it('still decode, and the date is ignored', async () => {
    const key = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify({ f: 'Amy', t: 'Ben', g: 'G', b: 'S$30', d: '2026-12-19' }));
    const ck = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new Uint8Array([1, 1]) }, ck, plain));
    const token = toBase64Url(new Uint8Array([1, 1, ...key, ...iv, ...ct]));
    expect(await decodeReveal(token)).toEqual({ giver: 'Amy', giftee: 'Ben', group: 'G', budget: 'S$30' });
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

// Realistic office names, 5-14 characters.
const POOL = [
  'Kelicia Ong', 'Cass', 'Sandra Lim', 'Terry', 'Charla', 'Joelle Tan', 'Genevieve', 'Marcus Lee', 'Priya Nair',
  'Daniel Koh', 'Aisha', 'Benjamin Teo', 'Chloe Wong', 'Darren Ng', 'Elaine Chua', 'Farhan', 'Grace Ho',
  'Hui Min', 'Irfan Rahman', 'Jasmine Goh', 'Kenneth Yeo', 'Li Wei', 'Melissa Tay', 'Nicholas', 'Olivia Sim',
  'Pei Shan', 'Qing Yi', 'Rachel Foo', 'Siti Nur', 'Timothy Lau',
];

describe('group link', () => {
  it('round-trips the full draw, including unicode names, for n = 3..50', async () => {
    for (const n of [3, 4, 7, 10, 30, 50]) {
      const names = Array.from({ length: n }, (_, i) => (i === 1 ? 'Zoë 陈美玲' : `${POOL[i % POOL.length]} ${i}`));
      const draw = makeDraw(names);
      const out = await decodeGroup(await encodeGroup(draw));
      expect(out.names).toEqual(names);
      expect(out.assignment).toEqual(draw.assignment);
      expect(out.group).toBe(meta.group);
      expect(out.budget).toBe(meta.budget);
      expect(drawId(out)).toBe(drawId(draw));
      expect(isValidAssignment(out.assignment, n)).toBe(true);
    }
  });

  it('handles empty group name and budget', async () => {
    const draw = newDraw(['Amy', 'Ben', 'Cat'], derange(3), { group: '', budget: '' });
    const out = await decodeGroup(await encodeGroup(draw));
    expect(out.group).toBe('');
    expect(out.budget).toBe('');
    expect(out.names).toEqual(['Amy', 'Ben', 'Cat']);
  });

  it('does not expose names in the token', async () => {
    const draw = makeDraw(POOL.slice(0, 10));
    const token = await encodeGroup(draw);
    const raw = new TextDecoder('latin1').decode(fromBase64Url(token));
    for (const n of draw.names) {
      expect(token.toLowerCase()).not.toContain(n.toLowerCase());
      expect(raw).not.toContain(n);
    }
  });

  it('is not interchangeable with personal or organiser tokens', async () => {
    const draw = makeDraw(['Amy', 'Ben', 'Cat']);
    const g = await encodeGroup(draw);
    await expect(decodeReveal(g)).rejects.toBeInstanceOf(LinkError);
    await expect(decodeOrganiser(g)).rejects.toBeInstanceOf(LinkError);
    await expect(decodeGroup(await encodeOrganiser(draw))).rejects.toBeInstanceOf(LinkError);
    const bytes = fromBase64Url(g);
    bytes[bytes.length - 3] ^= 0x40;
    await expect(decodeGroup(toBase64Url(bytes))).rejects.toBeInstanceOf(LinkError);
  });

  it('rejects an assignment that is not a derangement', () => {
    expect(isValidAssignment([1, 2, 0], 3)).toBe(true);
    expect(isValidAssignment([0, 2, 1], 3)).toBe(false);
    expect(isValidAssignment([1, 1, 0], 3)).toBe(false);
    expect(isValidAssignment([1, 0], 3)).toBe(false);
  });

  it('keeps the group URL short (logs lengths for 10 and 30 names)', async () => {
    const base = 'https://youtrip-marketing.github.io/secret-santa/';
    for (const n of [10, 30]) {
      const draw = makeDraw(POOL.slice(0, n));
      const { group } = await buildLinks(draw, base);
      console.log(`group URL, ${n} names: ${group.length} chars (token ${group.length - base.length - 4})`);
      expect(group.length).toBeLessThan(n === 10 ? 320 : 640);
    }
  });

  it('group message is paste-ready', async () => {
    const msg = groupMessage({ group: 'G', budget: 'S$30' }, 'https://x.test/#/g/abc');
    expect(msg).toBe('🎅 G\nBudget: S$30\nTap your name to draw: https://x.test/#/g/abc');
    expect(groupMessage({ group: '', budget: '' }, 'u')).toBe('🎅 Secret Santa\nTap your name to draw: u');
  });
});
