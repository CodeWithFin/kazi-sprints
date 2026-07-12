import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">Client Progress Portal</div>
      </div>
      <section className="panel stack">
        <h1>Choose your workspace</h1>
        <p>Internal admins manage delivery. Clients view progress only.</p>
        <div className="row">
          <Link className="button" href="/login?role=admin">
            Admin login
          </Link>
          <Link className="button secondary" href="/login?role=client">
            Client login
          </Link>
        </div>
      </section>
    </main>
  );
}
