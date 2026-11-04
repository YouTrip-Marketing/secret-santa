import { useEffect, useState } from 'react';
import { decodeOrganiser, type Draw } from '../lib/codec';
import { buildLinks, copyAllText, type DrawLinks } from '../lib/links';
import { copyText } from '../lib/clipboard';
import { saveLastDraw } from '../lib/storage';
import { navigate } from '../lib/router';
import { EventBanner } from '../components/EventBanner';
import { Holly } from '../components/Decor';
import { BrokenLink } from './BrokenLink';

function CopyButton({ text, label = 'Copy', big = false }: { text: string; label?: string; big?: boolean }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  async function onClick() {
    const ok = await copyText(text);
    setState(ok ? 'done' : 'fail');
    window.setTimeout(() => setState('idle'), 1600);
  }
  return (
    <button type="button" className={`btn ${big ? 'btn--primary' : 'btn--soft'} ${state === 'done' ? 'btn--done' : ''}`} onClick={onClick}>
      {state === 'done' ? 'Copied ✓' : state === 'fail' ? 'Copy failed' : label}
    </button>
  );
}

export function Links({ token }: { token: string }) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [links, setLinks] = useState<DrawLinks | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await decodeOrganiser(token);
        const l = await buildLinks(d);
        if (!alive) return;
        saveLastDraw(l.organiser);
        setDraw(d);
        setLinks(l);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  if (failed) return <BrokenLink />;
  if (!draw || !links) return <main className="page page--center"><p className="muted">Loading…</p></main>;

  function onNewDraw() {
    if (window.confirm('Start a new draw? Links from this draw keep working.')) navigate('/');
  }

  return (
    <main className="page">
      <header className="hero hero--small">
        <Holly />
        <h1>{draw.group || 'Secret Santa'}</h1>
        <p className="hero__sub">{draw.names.length} people · names drawn</p>
      </header>

      <EventBanner budget={draw.budget} date={draw.date} />

      <div className="notice" role="note">
        <strong>Don't open these links.</strong> Each one reveals that person's giftee. Send each person only their own link.
      </div>

      <section className="card">
        <div className="card__head">
          <h2>Personal links</h2>
          <CopyButton text={copyAllText(links.people)} label="Copy all" big />
        </div>
        <ul className="links">
          {links.people.map((p) => (
            <li key={p.name} className="links__row">
              <span className="links__name">{p.name}</span>
              <span className="links__url" title="Personal link">{p.url.replace(/^https?:\/\//, '')}</span>
              <CopyButton text={p.url} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card card--quiet">
        <h2>Organiser link</h2>
        <p className="muted">Bookmark or save this to get back to these links. Don't share it.</p>
        <div className="organiser-link">
          <code>{links.organiser.replace(/^https?:\/\//, '')}</code>
          <CopyButton text={links.organiser} />
        </div>
      </section>

      <p className="center">
        <button type="button" className="link" onClick={onNewDraw}>
          New draw
        </button>
      </p>
    </main>
  );
}
