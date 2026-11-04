/**
 * Link payload codec.
 *
 * Every draw gets a random 128-bit AES-GCM key. A link token is
 *   base64url( version(1) | kind(1) | key(16) | iv(12) | ciphertext+tag )
 * The key travels inside the token, so this is obfuscation (the giftee is not readable from the
 * URL bar), not secrecy from someone who decodes the token deliberately.
 *
 * IVs are deterministic: drawNonce(8) | index(4). Index 0..n-1 are reveal links, 0xFFFFFFFF is the
 * organiser link. That keeps (key, iv) unique per draw and lets the organiser link regenerate the
 * exact same reveal links later.
 */

export interface DrawMeta {
  group: string;
  budget: string;
  /** Exchange date as YYYY-MM-DD, or '' when not set. */
  date: string;
}

export interface RevealPayload extends DrawMeta {
  giver: string;
  giftee: string;
}

export interface Draw extends DrawMeta {
  names: string[];
  /** assignment[i] = index of giver i's giftee */
  assignment: number[];
  key: Uint8Array; // 16 bytes
  nonce: Uint8Array; // 8 bytes
}

const VERSION = 1;
const KIND_REVEAL = 1;
const KIND_ORGANISER = 2;
const ORGANISER_INDEX = 0xffffffff;
const HEADER_LEN = 1 + 1 + 16 + 12;

export class LinkError extends Error {}

// ---------- base64url ----------
export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new LinkError('bad characters');
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw new LinkError('bad base64');
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- crypto helpers ----------
function makeIv(nonce: Uint8Array, index: number): Uint8Array {
  const iv = new Uint8Array(12);
  iv.set(nonce, 0);
  new DataView(iv.buffer).setUint32(8, index >>> 0);
  return iv;
}

async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function seal(kind: number, keyRaw: Uint8Array, iv: Uint8Array, plain: Uint8Array): Promise<string> {
  const key = await importKey(keyRaw);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: new Uint8Array([VERSION, kind]) }, key, plain as BufferSource),
  );
  const out = new Uint8Array(HEADER_LEN + ct.length);
  out[0] = VERSION;
  out[1] = kind;
  out.set(keyRaw, 2);
  out.set(iv, 18);
  out.set(ct, HEADER_LEN);
  return toBase64Url(out);
}

async function open(token: string, expectedKind: number): Promise<{ plain: Uint8Array; key: Uint8Array; iv: Uint8Array }> {
  const bytes = fromBase64Url(token.trim());
  if (bytes.length < HEADER_LEN + 16) throw new LinkError('too short');
  if (bytes[0] !== VERSION) throw new LinkError('unknown version');
  if (bytes[1] !== expectedKind) throw new LinkError('wrong link type');
  const keyRaw = bytes.slice(2, 18);
  const iv = bytes.slice(18, HEADER_LEN);
  const key = await importKey(keyRaw);
  try {
    const plain = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: new Uint8Array([VERSION, expectedKind]) }, key, bytes.slice(HEADER_LEN)),
    );
    return { plain, key: keyRaw, iv };
  } catch {
    throw new LinkError('link damaged');
  }
}

// ---------- compression (organiser link only; it carries every name) ----------
async function pipeThrough(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
const deflate = (d: Uint8Array) => pipeThrough(d, new CompressionStream('deflate-raw'));
const inflate = (d: Uint8Array) => pipeThrough(d, new DecompressionStream('deflate-raw'));

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- draw creation ----------
export function newDraw(names: string[], assignment: number[], meta: DrawMeta): Draw {
  const key = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(8));
  return { ...meta, names, assignment, key, nonce };
}

// ---------- reveal links ----------
type RevealWire = { f: string; t: string; g: string; b: string; d: string };

export async function encodeReveal(draw: Draw, index: number): Promise<string> {
  const wire: RevealWire = {
    f: draw.names[index],
    t: draw.names[draw.assignment[index]],
    g: draw.group,
    b: draw.budget,
    d: draw.date,
  };
  return seal(KIND_REVEAL, draw.key, makeIv(draw.nonce, index), enc.encode(JSON.stringify(wire)));
}

export async function decodeReveal(token: string): Promise<RevealPayload> {
  const { plain } = await open(token, KIND_REVEAL);
  let w: Partial<RevealWire>;
  try {
    w = JSON.parse(dec.decode(plain));
  } catch {
    throw new LinkError('bad payload');
  }
  if (typeof w.f !== 'string' || typeof w.t !== 'string') throw new LinkError('bad payload');
  return { giver: w.f, giftee: w.t, group: w.g ?? '', budget: w.b ?? '', date: w.d ?? '' };
}

// ---------- organiser link ----------
type OrganiserWire = { g: string; b: string; d: string; n: string[]; a: number[] };

export async function encodeOrganiser(draw: Draw): Promise<string> {
  const wire: OrganiserWire = { g: draw.group, b: draw.budget, d: draw.date, n: draw.names, a: draw.assignment };
  const packed = await deflate(enc.encode(JSON.stringify(wire)));
  return seal(KIND_ORGANISER, draw.key, makeIv(draw.nonce, ORGANISER_INDEX), packed);
}

export async function decodeOrganiser(token: string): Promise<Draw> {
  const { plain, key, iv } = await open(token, KIND_ORGANISER);
  let w: Partial<OrganiserWire>;
  try {
    w = JSON.parse(dec.decode(await inflate(plain)));
  } catch {
    throw new LinkError('bad payload');
  }
  const names = w.n;
  const a = w.a;
  if (!Array.isArray(names) || !Array.isArray(a) || names.length !== a.length || names.some((x) => typeof x !== 'string')) {
    throw new LinkError('bad payload');
  }
  return { group: w.g ?? '', budget: w.b ?? '', date: w.d ?? '', names, assignment: a, key, nonce: iv.slice(0, 8) };
}
