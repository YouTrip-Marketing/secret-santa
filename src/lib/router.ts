import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'reveal'; token: string }
  | { page: 'organiser'; token: string }
  | { page: 'group'; token: string };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const m = /^\/(r|o|g)\/(.+)$/.exec(h);
  if (m) {
    const page = m[1] === 'r' ? 'reveal' : m[1] === 'o' ? 'organiser' : 'group';
    return { page, token: m[2] };
  }
  return { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(hash: string): void {
  window.location.hash = hash;
}
