import { encodeGroup, encodeOrganiser, encodeReveal, type Draw } from './codec';

export function appBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export interface DrawLinks {
  organiser: string;
  group: string;
  people: { name: string; url: string }[];
}

export async function buildLinks(draw: Draw, base = appBaseUrl()): Promise<DrawLinks> {
  const people = await Promise.all(
    draw.names.map(async (name, i) => ({ name, url: `${base}#/r/${await encodeReveal(draw, i)}` })),
  );
  return {
    organiser: `${base}#/o/${await encodeOrganiser(draw)}`,
    group: `${base}#/g/${await encodeGroup(draw)}`,
    people,
  };
}

export function copyAllText(people: DrawLinks['people']): string {
  return people.map((p) => `${p.name}: ${p.url}`).join('\n');
}

export function groupMessage(draw: Pick<Draw, 'group' | 'budget'>, groupUrl: string): string {
  const lines = [`🎅 ${draw.group || 'Secret Santa'}`];
  if (draw.budget) lines.push(`Budget: ${draw.budget}`);
  lines.push(`Tap your name to draw: ${groupUrl}`);
  return lines.join('\n');
}
