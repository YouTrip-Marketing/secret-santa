import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { Organiser } from './pages/Organiser';
import { Links } from './pages/Links';
import { Reveal } from './pages/Reveal';
import { Group } from './pages/Group';
import { Snow } from './components/Snow';
import { Scene } from './components/Scene';

export function App() {
  const route = useRoute();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (route.page === 'home' || route.page === 'organiser') document.title = 'Secret Santa';
  }, [route]);

  return (
    <>
      <Scene />
      <Snow />
      {route.page === 'reveal' ? (
        <Reveal key={route.token} token={route.token} />
      ) : route.page === 'group' ? (
        <Group key={route.token} token={route.token} />
      ) : route.page === 'organiser' ? (
        <Links key={route.token} token={route.token} />
      ) : (
        <Organiser />
      )}
    </>
  );
}
