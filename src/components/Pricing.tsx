import { CheckIcon } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ButtonLink } from './ButtonLink';
import { pricingTiers } from '../data/pricing';
import type { PlanId, PricingTier } from '../data/pricing';

type PricingProps = {onSelectPlan: (plan: PlanId) => void;};

/*
 * The featured card keeps one fixed navy palette in both themes, so its text colors never
 * need theme overrides. Standard cards use theme tokens throughout.
 */
const palette = {
  featured: {
    card: 'bg-navy shadow-lift ring-1 ring-navy dark:ring-2 dark:ring-accent',
    title: 'text-white',
    body: 'text-white/75',
    note: 'text-amber-300',
    divider: 'border-white/15',
    check: 'text-[#34D399]',
    feature: 'text-white/90'
  },
  standard: {
    card: 'border border-line bg-surface',
    title: 'text-ink',
    body: 'text-muted',
    note: 'text-warn',
    divider: 'border-line',
    check: 'text-accent-ink',
    feature: 'text-ink'
  }
};

export function Pricing({ onSelectPlan }: PricingProps) {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeader
          id="pricing-heading"
          title="Pricing that scales with your order volume"
          description="Start with a free analysis. Upgrade when you want ongoing settlement tracking and reports."
          aside={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-3 py-1.5 text-[12px] font-medium text-warn">
              Proposed pricing — subject to change at launch
            </span>
          } />
        

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier) =>
          <PricingCard key={tier.id} tier={tier} onSelect={() => onSelectPlan(tier.id)} />
          )}
        </div>
      </div>
    </section>);

}

function PricingCard({ tier, onSelect }: {tier: PricingTier;onSelect: () => void;}) {
  const c = tier.featured ? palette.featured : palette.standard;

  return (
    <article className={`relative flex flex-col rounded-2xl p-7 sm:p-8 ${c.card}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${c.title}`}>{tier.name}</h3>
        {tier.featured &&
        <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">Most popular</span>
        }
      </div>
      <p className={`mt-2 min-h-[3rem] text-sm leading-relaxed ${c.body}`}>{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className={`text-4xl font-semibold tracking-tight tabular-nums ${c.title}`}>{tier.price}</span>
        <span className={`text-sm ${c.body}`}>/ month</span>
      </div>
      <p className={`mt-1 text-[12px] ${c.note}`}>Proposed price</p>

      <div className="mt-7">
        <ButtonLink
          href="#get-started"
          fullWidth
          variant={tier.featured ? 'primary' : 'secondary'}
          onClick={onSelect}>
          
          {tier.cta}
        </ButtonLink>
      </div>

      <ul className={`mt-8 space-y-3 border-t pt-7 text-sm ${c.divider}`}>
        {tier.features.map((f) =>
        <li key={f} className="flex gap-3">
            <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${c.check}`} aria-hidden="true" />
            <span className={c.feature}>{f}</span>
          </li>
        )}
      </ul>
    </article>);

}