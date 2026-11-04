const KEY = 'secret-santa:last-organiser-link';

export function saveLastDraw(organiserUrl: string): void {
  try {
    localStorage.setItem(KEY, organiserUrl);
  } catch {
    /* storage unavailable: the organiser link is the real backup */
  }
}

export function loadLastDraw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLastDraw(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
