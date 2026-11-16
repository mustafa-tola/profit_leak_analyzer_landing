import { ArrowRightIcon, FileSpreadsheetIcon, LayoutDashboardIcon } from 'lucide-react';
import { ButtonLink } from './ButtonLink';
import { HeroSummaryCard } from './HeroSummaryCard';

const couriers = ['TCS', 'Leopards', 'PostEx', 'Trax', 'M&P', 'Call Courier'];

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-heading" className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-ink">Built for cash-on-delivery sellers in Pakistan</p>
          <h1
            id="hero-heading"
            className="mt-4 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
            Every COD rupee, reconciled and accounted for.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Codvera matches your orders, shipments, and courier settlements to show expected receivables, verified payments,
            outstanding balances, and evidence-backed exceptions — so you can act with clarity, not guesswork.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/app" size="lg">
              Start Free Analysis
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#demo" size="lg" variant="secondary">
              <LayoutDashboardIcon className="h-4 w-4" aria-hidden="true" />
              See Live Demo
            </ButtonLink>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
            No courier logins required — upload CSV exports and get results in minutes.
          </p>
        </div>

        <HeroSummaryCard />
      </div>

      <div className="border-y border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted">Designed around exports from couriers like</p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {couriers.map((c) => (
              <li key={c} className="text-[15px] font-semibold tracking-tight text-ink/70">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
