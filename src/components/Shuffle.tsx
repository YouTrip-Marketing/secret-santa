import { useEffect, useState } from 'react';

/** "Drawing from the hat": names flicker past, slowing down, then onDone fires. */
export function Shuffle({ names, onDone }: { names: string[]; onDone: () => void }) {
  const [shown, setShown] = useState(names[0] ?? '');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || names.length === 0) {
      onDone();
      return;
    }
    let delay = 60;
    let elapsed = 0;
    let last = -1;
    let timer = 0;
    const tick = () => {
      let i = Math.floor(Math.random() * names.length);
      if (names.length > 1 && i === last) i = (i + 1) % names.length;
      last = i;
      setShown(names[i]);
      elapsed += delay;
      delay *= 1.13;
      timer = window.setTimeout(elapsed > 1500 ? onDone : tick, delay);
    };
    tick();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="stage">
      <div className="hat" aria-hidden="true">
        <svg viewBox="0 0 200 150" className="hat__svg">
          <ellipse cx="100" cy="132" rx="90" ry="14" fill="#a8352e" />
          <rect x="50" y="22" width="100" height="112" rx="12" fill="#c8463d" />
          <ellipse cx="100" cy="24" rx="50" ry="10" fill="#7a2620" />
          <rect x="50" y="98" width="100" height="18" fill="#2f6b4f" />
          <circle cx="128" cy="107" r="7" fill="#e3b04b" />
          <path d="M62 40 C 64 70, 64 90, 62 96" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.25" fill="none" />
        </svg>
        <div className="hat__name" key={shown}>{shown}</div>
      </div>
      <p className="hint">Drawing…</p>
    </section>
  );
}
