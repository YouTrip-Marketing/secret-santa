import { useMemo } from 'react';

const FLAKES = 36;

export function Snow() {
  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKES }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 7,
        duration: 9 + Math.random() * 10,
        delay: -Math.random() * 18,
        drift: (Math.random() - 0.5) * 80,
        opacity: 0.45 + Math.random() * 0.5,
      })),
    [],
  );
  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              '--drift': `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
