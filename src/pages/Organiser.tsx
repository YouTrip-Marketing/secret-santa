import { useMemo, useState } from 'react';
import { derange } from '../lib/derange';
import { encodeOrganiser, newDraw } from '../lib/codec';
import { MIN_PEOPLE, parseNames } from '../lib/names';
import { loadLastDraw, saveLastDraw } from '../lib/storage';
import { appBaseUrl } from '../lib/links';
import { navigate } from '../lib/router';
import { Holly } from '../components/Decor';

export function Organiser() {
  const [group, setGroup] = useState('');
  const [names, setNames] = useState('');
  const [budget, setBudget] = useState('S$30');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastDraw = useMemo(() => loadLastDraw(), []);

  const count = names.split(/\r?\n/).filter((s) => s.trim()).length;

  async function onDraw(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseNames(names);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const draw = newDraw(parsed.names, derange(parsed.names.length), {
        group: group.trim(),
        budget: budget.trim(),
      });
      const token = await encodeOrganiser(draw);
      saveLastDraw(`${appBaseUrl()}#/o/${token}`);
      navigate(`/o/${token}`);
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <Holly />
        <h1>Secret Santa</h1>
      </header>

      <form className="card form" onSubmit={onDraw} noValidate>
        <label className="field">
          <span className="field__label">Group name <em>(optional)</em></span>
          <input
            type="text"
            value={group}
            maxLength={60}
            placeholder="YouTrip Marketing Secret Santa 2026"
            onChange={(e) => setGroup(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">
            Names <em>(one per line)</em>
            <span className={`count ${count >= MIN_PEOPLE ? 'count--ok' : ''}`}>{count}</span>
          </span>
          <textarea
            value={names}
            rows={8}
            placeholder={'Kelicia\nCass\nSandra'}
            onChange={(e) => setNames(e.target.value)}
            aria-invalid={!!error}
          />
        </label>

        <label className="field">
          <span className="field__label">Budget</span>
          <input type="text" value={budget} maxLength={20} onChange={(e) => setBudget(e.target.value)} />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--big" type="submit" disabled={busy}>
          {busy ? 'Drawing…' : 'Draw names'}
        </button>
      </form>

      {lastDraw && (
        <p className="center">
          <a className="link" href={lastDraw}>
            Open last draw
          </a>
        </p>
      )}
    </main>
  );
}
