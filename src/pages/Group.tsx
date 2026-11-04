import { useEffect, useMemo, useState } from 'react';
import { decodeGroup, drawId, type Draw } from '../lib/codec';
import { clearGroupMember, loadGroupMember, saveGroupMember } from '../lib/storage';
import { BudgetBanner } from '../components/BudgetBanner';
import { RevealFlow } from '../components/RevealFlow';
import { Shuffle } from '../components/Shuffle';
import { BrokenLink } from './BrokenLink';

type Step =
  | { kind: 'pick' }
  | { kind: 'confirm'; me: number }
  | { kind: 'shuffle'; me: number }
  | { kind: 'reveal'; me: number; remembered: boolean };

export function Group({ token }: { token: string }) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'pick' });

  useEffect(() => {
    let alive = true;
    decodeGroup(token)
      .then((d) => {
        if (!alive) return;
        const saved = loadGroupMember(drawId(d));
        const me = saved === null ? -1 : d.names.indexOf(saved);
        setDraw(d);
        if (me >= 0) setStep({ kind: 'reveal', me, remembered: true });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (draw) document.title = draw.group || 'Secret Santa';
  }, [draw]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step.kind]);

  const shuffleNames = useMemo(() => {
    if (!draw || step.kind !== 'shuffle') return [];
    return draw.names.filter((_, i) => i !== step.me);
  }, [draw, step]);

  if (failed) return <BrokenLink />;
  if (!draw) return <main className="page page--center"><p className="muted">Loading…</p></main>;

  const id = drawId(draw);
  const title = draw.group || 'Secret Santa';

  function confirm(me: number) {
    saveGroupMember(id, draw!.names[me]);
    setStep({ kind: 'shuffle', me });
  }

  function switchPerson() {
    clearGroupMember(id);
    setStep({ kind: 'pick' });
  }

  const me = step.kind === 'pick' ? -1 : step.me;

  return (
    <main className="page page--reveal">
      <header className="hero hero--small">
        {me >= 0 && step.kind !== 'confirm' && <p className="tag">For {draw.names[me]}</p>}
        <h1>{title}</h1>
      </header>
      <BudgetBanner budget={draw.budget} />

      {step.kind === 'pick' && (
        <section className="card who">
          <h2 className="who__title">Who are you?</h2>
          <ul className="chips">
            {draw.names.map((name, i) => (
              <li key={name}>
                <button type="button" className={`chip chip--${i % 3}`} onClick={() => setStep({ kind: 'confirm', me: i })}>
                  <span className="chip__dot" aria-hidden="true">{[...name][0]?.toUpperCase()}</span>
                  <span className="chip__name">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step.kind === 'confirm' && (
        <section className="card confirm">
          <p className="confirm__q">
            You're <strong>{draw.names[step.me]}</strong>?
          </p>
          <div className="confirm__actions">
            <button type="button" className="btn btn--primary btn--big" onClick={() => confirm(step.me)}>
              Yes, draw!
            </button>
            <button type="button" className="btn btn--soft" onClick={() => setStep({ kind: 'pick' })}>
              Back
            </button>
          </div>
        </section>
      )}

      {step.kind === 'shuffle' && (
        <Shuffle names={shuffleNames} onDone={() => setStep({ kind: 'reveal', me: step.me, remembered: false })} />
      )}

      {step.kind === 'reveal' && (
        <>
          <RevealFlow giftee={draw.names[draw.assignment[step.me]]} startOpen={step.remembered} />
          <p className="center switch">
            <button type="button" className="link" onClick={switchPerson}>
              Not {draw.names[step.me]}? Switch
            </button>
          </p>
        </>
      )}
    </main>
  );
}
