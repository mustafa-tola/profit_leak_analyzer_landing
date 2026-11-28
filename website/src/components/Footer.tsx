import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { navLinks } from '../data/navigation';

const linkClass =
  'text-sm text-muted transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_0.8fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            COD reconciliation and settlement intelligence for Pakistani sellers. Track expected vs verified payments,
            outstanding receivables, and evidence-backed exceptions in one workspace.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-sm font-semibold text-ink">Product</h2>
          <ul className="mt-4 space-y-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link to={l.href.startsWith('#') ? `/${l.href}` : `/${l.href}`} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-ink">Get started</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Upload your order, shipment, and settlement CSVs to generate a reconciliation run with clear, auditable results.
          </p>
          <Link to="/app" className="mt-4 inline-block text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
            Open Marginovia workspace
          </Link>
        </div>

        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold text-ink">Legal</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link to="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={linkClass}>
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-[12px] text-muted sm:px-6 md:flex-row md:justify-between">
          <p>© 2026 Marginovia. All rights reserved.</p>
          <p>Sample dashboard figures are illustrative. Flagged discrepancies are provisional and not confirmed losses.</p>
        </div>
      </div>
    </footer>
  );
}
