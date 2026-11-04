import { memo, type ReactElement } from 'react';

/*
 * Fixed festive backdrop: fairy lights + stars along the top, moon, and a snowy village along the bottom.
 * Both strips use `slice` so narrow screens crop the sides and keep the centre of the scene.
 */

const BULB = ['#c8463d', '#e3b04b', '#2f6b4f', '#e07a5f', '#f6e7cb'];
const SNOW = '#fffdf8';

function quad(x0: number, x1: number, sag: number, t: number) {
  // quadratic from (x0,0) to (x1,0) with control at (mid, 2*sag): peaks at y = sag
  const cx = (x0 + x1) / 2;
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
  const y = 2 * (1 - t) * t * (2 * sag) + 6;
  return { x, y };
}

function Lights() {
  const span = 240;
  const sag = 26;
  const wire: string[] = [];
  const bulbs: ReactElement[] = [];
  let n = 0;
  for (let k = -1; k < 7; k++) {
    const x0 = k * span;
    const x1 = x0 + span;
    wire.push(`M${x0} 6 Q${(x0 + x1) / 2} ${6 + 2 * sag} ${x1} 6`);
    for (const t of [0.17, 0.39, 0.61, 0.83]) {
      const { x, y } = quad(x0, x1, sag, t);
      const colour = BULB[n % BULB.length];
      bulbs.push(
        <g key={n} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
          <rect x="-3.5" y="-1" width="7" height="6" rx="1.5" fill="#5b4a3f" />
          <ellipse className={`bulb bulb--${n % 3}`} cx="0" cy="12" rx="6" ry="8.5" fill={colour} />
          <ellipse cx="-2" cy="9" rx="1.6" ry="2.6" fill="#fff" opacity="0.55" />
        </g>,
      );
      n++;
    }
  }
  const stars = [
    [120, 120, 1], [300, 190, 0.7], [470, 110, 0.8], [610, 205, 0.6], [860, 108, 0.7],
    [980, 105, 0.9], [1100, 200, 0.6], [1330, 130, 1], [60, 220, 0.6], [1400, 225, 0.7],
    [1240, 240, 0.5],
  ];
  return (
    <svg className="scene__top" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {stars.map(([x, y, s], i) => (
        <path
          key={i}
          className={`star star--${i % 3}`}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 -10 C 1.5 -2, 2 -1.5, 10 0 C 2 1.5, 1.5 2, 0 10 C -1.5 2, -2 1.5, -10 0 C -2 -1.5, -1.5 -2, 0 -10 Z"
          fill="#e3b04b"
        />
      ))}
      <path d={wire.join(' ')} stroke="#5b4a3f" strokeWidth="2" fill="none" opacity="0.7" />
      {bulbs}
    </svg>
  );
}

function Moon() {
  return (
    <svg className="scene__moon" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="#f6e7cb" opacity="0.5" />
      <path d="M52 14 A 28 28 0 1 0 66 52 A 22 22 0 1 1 52 14 Z" fill="#f2cf7e" />
      <circle cx="36" cy="50" r="3" fill="#e3b04b" opacity="0.6" />
      <circle cx="28" cy="36" r="2" fill="#e3b04b" opacity="0.6" />
    </svg>
  );
}

function Pine({ x, y, s = 1, fill = '#2f6b4f' }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-14" width="10" height="16" rx="2" fill="#7a5640" />
      <g fill={fill} stroke={fill} strokeWidth="6" strokeLinejoin="round">
        <path d="M-38 -12 L0 -62 L38 -12 Z" />
        <path d="M-30 -46 L0 -94 L30 -46 Z" />
        <path d="M-21 -78 L0 -120 L21 -78 Z" />
      </g>
      <g fill={SNOW}>
        <path d="M-12 -110 Q0 -104 12 -110 L0 -124 Z" />
        <path d="M-28 -50 Q-14 -42 0 -48 Q14 -42 28 -50 L22 -56 Q0 -50 -22 -56 Z" opacity="0.9" />
        <path d="M-38 -14 Q-19 -6 0 -12 Q19 -6 38 -14 L32 -20 Q0 -14 -32 -20 Z" opacity="0.9" />
      </g>
    </g>
  );
}

function House({ x, y, s = 1, roof = '#c8463d', wall = '#f3dcc0' }: { x: number; y: number; s?: number; roof?: string; wall?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="22" y="-96" width="16" height="30" rx="3" fill="#8a5a44" />
      <rect x="20" y="-100" width="20" height="8" rx="4" fill={SNOW} />
      <rect x="-46" y="-62" width="92" height="62" rx="8" fill={wall} />
      <path d="M-58 -56 L0 -104 L58 -56 Z" fill={roof} stroke={roof} strokeWidth="10" strokeLinejoin="round" />
      <path d="M-64 -52 Q-60 -46 -52 -50 L0 -94 L52 -50 Q60 -46 64 -52 L0 -110 Z" fill={SNOW} />
      <rect className="window" x="-32" y="-46" width="22" height="20" rx="5" fill="#f2cf7e" />
      <path d="M-21 -46 V-26 M-32 -36 H-10" stroke={wall} strokeWidth="3" />
      <rect x="10" y="-38" width="22" height="38" rx="9" fill="#2f6b4f" />
      <circle cx="27" cy="-18" r="2" fill="#e3b04b" />
      <circle cx="21" cy="-46" r="7" fill="none" stroke="#3a7d5c" strokeWidth="4" />
      <circle cx="21" cy="-39" r="2.5" fill="#c8463d" />
    </g>
  );
}

function Snowman({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-26" r="26" fill={SNOW} stroke="#ead9bb" strokeWidth="2" />
      <circle cx="0" cy="-70" r="18" fill={SNOW} stroke="#ead9bb" strokeWidth="2" />
      <path d="M-18 -56 Q0 -48 18 -56 L16 -50 Q0 -43 -16 -50 Z" fill="#c8463d" />
      <rect x="6" y="-56" width="8" height="22" rx="3" fill="#c8463d" transform="rotate(-12 10 -45)" />
      <circle cx="-6" cy="-74" r="2.2" fill="#3b2a24" />
      <circle cx="6" cy="-74" r="2.2" fill="#3b2a24" />
      <path d="M0 -68 L12 -65 L0 -64 Z" fill="#e07a5f" />
      <circle cx="0" cy="-30" r="2.4" fill="#3b2a24" />
      <circle cx="0" cy="-18" r="2.4" fill="#3b2a24" />
      <path d="M-14 -94 H14 L10 -104 H-10 Z" fill="#2f6b4f" />
      <rect x="-18" y="-92" width="36" height="5" rx="2.5" fill="#2f6b4f" />
    </g>
  );
}

function Village() {
  return (
    <svg className="scene__bottom" viewBox="0 0 1440 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {/* far hills + distant trees */}
      <path d="M0 210 C 200 150, 380 170, 560 195 C 760 222, 900 150, 1100 160 C 1260 168, 1360 190, 1440 180 V340 H0 Z" fill="#efe1c7" />
      {[90, 170, 640, 700, 1040, 1120, 1380].map((x, i) => (
        <Pine key={x} x={x} y={i % 2 ? 200 : 192} s={0.45} fill="#9fbfa9" />
      ))}
      {/* mid hill */}
      <path d="M0 250 C 240 205, 420 225, 640 240 C 860 255, 1040 205, 1240 215 C 1340 220, 1400 232, 1440 236 V340 H0 Z" fill="#f8efdf" />
      <House x={265} y={262} s={0.85} roof="#2f6b4f" wall="#f6e2c6" />
      <Pine x={520} y={258} s={0.8} />
      <House x={725} y={262} s={1} />
      <Pine x={905} y={262} s={0.7} fill="#3a7d5c" />
      <House x={1180} y={256} s={0.8} roof="#d4544a" wall="#f6e2c6" />
      <Pine x={1350} y={262} s={0.95} />
      <Pine x={70} y={268} s={0.9} fill="#3a7d5c" />
      {/* front snow */}
      <path d="M0 290 C 180 262, 360 276, 560 286 C 760 296, 960 258, 1160 268 C 1300 275, 1380 284, 1440 280 V340 H0 Z" fill={SNOW} />
      <Snowman x={985} y={312} s={0.7} />
      <Pine x={420} y={318} s={0.6} fill="#3a7d5c" />
      <g fill="#ead9bb" opacity="0.6">
        <ellipse cx="620" cy="318" rx="60" ry="4" />
        <ellipse cx="1240" cy="310" rx="80" ry="4" />
        <ellipse cx="180" cy="314" rx="70" ry="4" />
      </g>
    </svg>
  );
}

export const Scene = memo(function Scene() {
  return (
    <div className="scene" aria-hidden="true">
      <Lights />
      <Moon />
      <Village />
    </div>
  );
});
