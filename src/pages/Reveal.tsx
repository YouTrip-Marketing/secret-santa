import { useEffect, useState } from 'react';
import { decodeReveal, type RevealPayload } from '../lib/codec';
import { BudgetBanner } from '../components/BudgetBanner';
import { RevealFlow } from '../components/RevealFlow';
import { BrokenLink } from './BrokenLink';

export function Reveal({ token }: { token: string }) {
  const [data, setData] = useState<RevealPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    decodeReveal(token)
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (data) document.title = data.group || 'Secret Santa';
  }, [data]);

  if (failed) return <BrokenLink />;
  if (!data) return <main className="page page--center"><p className="muted">Loading…</p></main>;

  return (
    <main className="page page--reveal">
      <header className="hero hero--small">
        <p className="tag">For {data.giver}</p>
        <h1>{data.group || 'Secret Santa'}</h1>
      </header>
      <BudgetBanner budget={data.budget} />
      <RevealFlow giftee={data.giftee} />
    </main>
  );
}
