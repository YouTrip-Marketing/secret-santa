export function BudgetBanner({ budget }: { budget: string }) {
  if (!budget) return null;
  return (
    <section className="banner" aria-label="Budget">
      <span className="banner__label">Budget</span>
      <span className="banner__value">{budget}</span>
    </section>
  );
}
