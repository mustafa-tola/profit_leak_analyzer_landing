import { settlementStatus as sampleSlices, type SettlementSlice } from '../../data/dashboard';
import { formatPKR, formatPercent } from '../../utils/currency';

export function SettlementBreakdown({
  slices = sampleSlices,
  label,
}: {
  slices?: SettlementSlice[];
  label?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.amount, 0);

  return (
    <section aria-labelledby="settlement-heading" className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <h3 id="settlement-heading" className="font-display text-base font-semibold text-ink">Settlement breakdown</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">{label ?? `${formatPKR(total)} total`}</p>

      <div
        className="mt-5 flex h-3 overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
        role="img"
        aria-label="Settlement distribution by amount"
      >
        {slices.map((s) => (
          <div
            key={s.label}
            className={`${s.colorClass} h-full first:rounded-l-full last:rounded-r-full`}
            style={{ width: total > 0 ? `${(s.amount / total) * 100}%` : '0%', minWidth: s.amount > 0 ? '4px' : '0' }}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {slices.map((s) => (
          <li key={s.label} className="flex min-w-0 items-center gap-2.5 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.colorClass}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-ink" title={s.label}>{s.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-ink money [overflow-wrap:anywhere]">{formatPKR(s.amount)}</span>
            <span className="w-12 shrink-0 text-right tabular-nums text-muted">{formatPercent(s.amount, total)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-auto border-t border-line pt-4 text-xs leading-relaxed text-muted sm:text-[13px]">
        Amounts reflect the selected run's settlement status breakdown. Overdue labeling requires known settlement terms and sufficient coverage.
      </p>
    </section>
  );
}