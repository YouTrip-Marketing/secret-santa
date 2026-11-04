import { useRef, useState } from 'react';
import { Gift, type GiftState } from './Gift';
import { burstConfetti } from './confetti';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Wrapped gift -> tap -> unwrap -> confetti -> giftee card. */
export function RevealFlow({ giftee, startOpen = false }: { giftee: string; startOpen?: boolean }) {
  const [gift, setGift] = useState<GiftState>(startOpen ? 'open' : 'wrapped');
  const giftRef = useRef<HTMLButtonElement>(null);

  function unwrap() {
    if (gift !== 'wrapped') return;
    setGift('opening');
    window.setTimeout(() => {
      setGift('open');
      const r = giftRef.current?.getBoundingClientRect();
      burstConfetti(r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top + r.height / 2 : window.innerHeight / 2);
    }, reducedMotion() ? 0 : 650);
  }

  return (
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
          <p className="result__name">{giftee}</p>
          <p className="result__secret">Keep it secret 🤫</p>
        </div>
      )}
    </section>
  );
}
