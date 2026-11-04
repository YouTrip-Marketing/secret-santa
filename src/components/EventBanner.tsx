import { useEffect, useState } from 'react';
import { countdownTo, formatDate } from '../lib/date';

interface Props {
  budget: string;
  date: string;
}

export function EventBanner({ budget, date }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!date) return;
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, [date]);

  const cd = countdownTo(date, now);
  const pretty = formatDate(date);
  if (!budget && !pretty) return null;

  return (
    <section className="banner" aria-label="Gift exchange details">
      <div className="banner__facts">
        {budget && (
          <div className="fact">
            <span className="fact__label">Budget</span>
            <span className="fact__value">{budget}</span>
          </div>
        )}
        {pretty && (
          <div className="fact">
            <span className="fact__label">Gift exchange</span>
            <span className="fact__value">{pretty}</span>
          </div>
        )}
      </div>
      {cd && cd.state === 'before' && (
        <div className="countdown" role="timer" aria-live="off">
          {([
            ['days', cd.days],
            ['hrs', cd.hours],
            ['min', cd.minutes],
            ['sec', cd.seconds],
          ] as const).map(([label, value]) => (
            <div className="countdown__cell" key={label}>
              <span className="countdown__num">{String(value).padStart(2, '0')}</span>
              <span className="countdown__label">{label}</span>
            </div>
          ))}
        </div>
      )}
      {cd && cd.state === 'today' && <p className="banner__today">Gift day is today 🎄</p>}
      {cd && cd.state === 'after' && <p className="banner__past">Gift exchange done</p>}
    </section>
  );
}
