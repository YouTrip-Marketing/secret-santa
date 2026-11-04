export interface Countdown {
  state: 'before' | 'today' | 'after';
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Parses YYYY-MM-DD as local midnight. Returns null for empty/invalid input. */
export function parseLocalDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

export function countdownTo(iso: string, now: Date): Countdown | null {
  const start = parseLocalDate(iso);
  if (!start) return null;
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  if (now >= end) return { state: 'after', days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (now >= start) return { state: 'today', days: 0, hours: 0, minutes: 0, seconds: 0 };
  let s = Math.floor((start.getTime() - now.getTime()) / 1000);
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  return { state: 'before', days, hours, minutes, seconds: s - minutes * 60 };
}

export function formatDate(iso: string): string {
  const d = parseLocalDate(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
