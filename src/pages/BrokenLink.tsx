import { Holly } from '../components/Decor';

export function BrokenLink() {
  return (
    <main className="page page--center">
      <div className="card center">
        <Holly />
        <h1 className="h-small">This link doesn't work</h1>
        <p className="muted">It may be incomplete. Copy the full link again or ask your organiser for it.</p>
      </div>
    </main>
  );
}
