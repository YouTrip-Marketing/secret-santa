import { encodeOrganiser, encodeReveal, type Draw } from './codec';

export function appBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export interface DrawLinks {
  organiser: string;
  people: { name: string; url: string }[];
}

export async function buildLinks(draw: Draw, base = appBaseUrl()): Promise<DrawLinks> {
  const people = await Promise.all(
    draw.names.map(async (name, i) => ({ name, url: `${base}#/r/${await encodeReveal(draw, i)}` })),
  );
  return { organiser: `${base}#/o/${await encodeOrganiser(draw)}`, people };
}

export function copyAllText(people: DrawLinks['people']): string {
  return people.map((p) => `${p.name}: ${p.url}`).join('\n');
}
