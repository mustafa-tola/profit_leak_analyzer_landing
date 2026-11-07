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
            Financial analytics for Pakistani cash-on-delivery sellers. Find hidden courier costs, RTO losses and
            potential settlement discrepancies — with the evidence to back them.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-sm font-semibold text-ink">Product</h2>
          <ul className="mt-4 space-y-3">
            {navLinks.map((l) =>
            <li key={l.href}>
                <Link to={`/${l.href}`} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-ink">Prototype notice</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            This is an academic demo. Dashboard figures are illustrative, and no live contact channels or business
            address are published.
          </p>
          <Link to="/#get-started" className={`mt-4 inline-block ${linkClass}`}>
            Try the demo form
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
          <p>© 2026 Profit Leak Analyzer. All rights reserved.</p>
          <p>Dashboard figures on this site are sample data. Potential discrepancies are not confirmed losses.</p>
        </div>
      </div>
    </footer>);

}