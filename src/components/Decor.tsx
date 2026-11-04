/** Small holly sprig used beside headings. */
export function Holly({ className = '' }: { className?: string }) {
  return (
    <svg className={`holly ${className}`} viewBox="0 0 64 40" aria-hidden="true">
      <path d="M30 22 C 22 6, 6 10, 2 4 C 4 14, 10 16, 6 22 C 14 20, 18 28, 30 22 Z" fill="#2f6b4f" />
      <path d="M34 22 C 42 6, 58 10, 62 4 C 60 14, 54 16, 58 22 C 50 20, 46 28, 34 22 Z" fill="#3a7d5c" />
      <circle cx="28" cy="26" r="5" fill="#c8463d" />
      <circle cx="37" cy="27" r="5" fill="#d4544a" />
      <circle cx="32" cy="34" r="5" fill="#b83f37" />
      <circle cx="26.5" cy="24.5" r="1.4" fill="#fff" opacity="0.7" />
    </svg>
  );
}
