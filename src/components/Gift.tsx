export type GiftState = 'wrapped' | 'opening' | 'open';

export function Gift({ state }: { state: GiftState }) {
  return (
    <svg className={`gift gift--${state}`} viewBox="0 0 220 220" role="img" aria-label="Wrapped gift">
      <defs>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2.6" fill="#f6e7cb" opacity="0.55" />
          <circle cx="16" cy="16" r="2.6" fill="#f6e7cb" opacity="0.55" />
        </pattern>
      </defs>
      <ellipse cx="110" cy="203" rx="78" ry="9" fill="#3b2a24" opacity="0.12" />
      <g className="gift__body">
        <rect x="36" y="96" width="148" height="104" rx="12" fill="#c8463d" />
        <rect x="36" y="96" width="148" height="104" rx="12" fill="url(#dots)" />
        <rect x="36" y="96" width="148" height="14" fill="#a8352e" opacity="0.6" />
        <rect x="99" y="96" width="22" height="104" fill="#2f6b4f" />
      </g>
      <g className="gift__lid">
        <rect x="26" y="72" width="168" height="34" rx="10" fill="#d4544a" />
        <rect x="26" y="72" width="168" height="34" rx="10" fill="url(#dots)" />
        <rect x="99" y="72" width="22" height="34" fill="#3a7d5c" />
        <path d="M110 72 C 86 40, 52 46, 64 66 C 72 78, 98 76, 110 72 Z" fill="#3a7d5c" />
        <path d="M110 72 C 134 40, 168 46, 156 66 C 148 78, 122 76, 110 72 Z" fill="#3a7d5c" />
        <path d="M110 72 C 92 52, 70 54, 74 64" stroke="#2f6b4f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M110 72 C 128 52, 150 54, 146 64" stroke="#2f6b4f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="110" cy="72" r="10" fill="#2f6b4f" />
      </g>
    </svg>
  );
}
