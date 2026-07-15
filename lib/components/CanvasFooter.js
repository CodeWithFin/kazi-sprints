import Link from 'next/link';

export default function CanvasFooter() {
  return (
    <footer className="canvas-footer-section">
      <div className="canvas-footer-inner">
        <div className="canvas-footer-cta">
          <h2 className="canvas-footer-title">
            Ready to bring
            <br />
            your projects together?
          </h2>
          <p className="canvas-footer-sub">
            Track progress, collaborate with clients, and ship with confidence.
          </p>
          <div className="canvas-footer-actions">
            <Link className="canvas-footer-primary" href="/login?role=admin">Get started</Link>
            <Link className="canvas-footer-link" href="/login">Log in</Link>
          </div>
        </div>

        <div className="canvas-footer-links">
          <div className="canvas-footer-brand">
            <div className="canvas-footer-logo-row">
              <div className="canvas-footer-logo">S</div>
              <div className="canvas-footer-brand-name">Sprints</div>
            </div>
            <p className="canvas-footer-desc">
              A client progress tracking platform that connects GitHub activity to transparent milestone updates.
            </p>
          </div>

          <nav className="canvas-footer-col" aria-label="Platform links">
            <h3>Platform</h3>
            <Link href="/">Home</Link>
            <Link href="/login?role=admin">Admin Dashboard</Link>
            <Link href="/login?role=client">Client Portal</Link>
          </nav>

          <nav className="canvas-footer-col" aria-label="Resources links">
            <h3>Resources</h3>
            <Link href="https://docs.github.com/en/webhooks" target="_blank">GitHub Webhooks</Link>
            <Link href="https://nextjs.org/docs" target="_blank">Next.js Docs</Link>
          </nav>

          <nav className="canvas-footer-col" aria-label="Company links">
            <h3>Company</h3>
            <Link href="#">About</Link>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
          </nav>

          <nav className="canvas-footer-col" aria-label="Compare links">
            <h3>Compare</h3>
            <Link href="#">Milestone Tracking</Link>
            <Link href="#">Client Portals</Link>
            <Link href="#">GitHub Sync</Link>
          </nav>
        </div>

        <div className="canvas-footer-bottom">
          <p>© {new Date().getFullYear()} Sprints. All rights reserved.</p>
          <div className="canvas-footer-bottom-right">
            <div className="canvas-footer-legal">
              <Link href="#">Privacy</Link>
              <span className="canvas-footer-divider"></span>
              <Link href="#">Terms</Link>
              <span className="canvas-footer-divider"></span>
              <Link href="#">Status</Link>
            </div>
            <div className="canvas-footer-socials">
              <Link className="canvas-footer-social" href="#" aria-label="GitHub">GH</Link>
              <Link className="canvas-footer-social" href="#" aria-label="Twitter">𝕏</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
