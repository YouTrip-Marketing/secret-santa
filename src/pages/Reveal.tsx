import { useEffect, useRef, useState } from 'react';
import { decodeReveal, type RevealPayload } from '../lib/codec';
import { BudgetBanner } from '../components/BudgetBanner';
import { Gift, type GiftState } from '../components/Gift';
import { burstConfetti } from '../components/confetti';
import { BrokenLink } from './BrokenLink';

export function Reveal({ token }: { token: string }) {
  const [data, setData] = useState<RevealPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [gift, setGift] = useState<GiftState>('wrapped');
  const giftRef = useRef<HTMLButtonElement>(null);

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

  function unwrap() {
    if (gift !== 'wrapped') return;
    setGift('opening');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      setGift('open');
      const r = giftRef.current?.getBoundingClientRect();
      burstConfetti(r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top + r.height / 2 : window.innerHeight / 2);
    }, reduced ? 0 : 650);
  }

  return (
    <main className="page page--reveal">
      <header className="hero hero--small">
        <p className="tag">For {data.giver}</p>
        <h1>{data.group || 'Secret Santa'}</h1>
      </header>

      <BudgetBanner budget={data.budget} />

      <section className="stage">
        {gift !== 'open' ? (
          <>
            <button ref={giftRef} type="button" className="gift-btn" onClick={unwrap} aria-label="Unwrap your gift">
              <Gift state={gift} />
            </button>
            <p className={`hint ${gift === 'opening' ? 'hint--hide' : ''}`}>Tap to unwrap</p>
          </>
        ) : (
          <div className="result" aria-live="polite">
            <p className="result__lead">You're the Secret Santa for</p>
            <p className="result__name">{data.giftee}</p>
            <p className="result__secret">Keep it secret 🤫</p>
          </div>
        )}
      </section>
    </main>
  );
}
