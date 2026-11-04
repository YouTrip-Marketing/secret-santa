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

const groupKey = (id: string) => `secret-santa:group:${id}`;

export function loadGroupMember(id: string): string | null {
  try {
    return localStorage.getItem(groupKey(id));
  } catch {
    return null;
  }
}

export function saveGroupMember(id: string, name: string): void {
  try {
    localStorage.setItem(groupKey(id), name);
  } catch {
    /* ignore */
  }
}

export function clearGroupMember(id: string): void {
  try {
    localStorage.removeItem(groupKey(id));
  } catch {
    /* ignore */
  }
}
