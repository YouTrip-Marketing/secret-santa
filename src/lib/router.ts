import { useEffect, useState } from 'react';

export type Route = { page: 'home' } | { page: 'reveal'; token: string } | { page: 'organiser'; token: string };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const m = /^\/(r|o)\/(.+)$/.exec(h);
  if (m) return m[1] === 'r' ? { page: 'reveal', token: m[2] } : { page: 'organiser', token: m[2] };
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
