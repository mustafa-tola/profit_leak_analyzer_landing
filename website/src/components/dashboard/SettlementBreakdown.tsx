import { settlementStatus as sampleSlices, type SettlementSlice } from '../../data/dashboard';
import { formatPKR, formatPercent } from '../../utils/currency';
import { SettlementProgress, type SettlementProgressCounts } from './SettlementProgress';

type SettlementBreakdownProps = {
  slices?: SettlementSlice[];
  label?: string;
  progress?: SettlementProgressCounts;
};

export function SettlementBreakdown({ slices = sampleSlices, label, progress }: SettlementBreakdownProps) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  return (
    <section
      aria-labelledby="settlement-heading"
      className="flex min-w-0 flex-col rounded-[14px] border border-line bg-surface p-4 shadow-sm transition-colors duration-150 hover:bg-subtle/20 sm:p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Settlement status</p>
      <h3 id="settlement-heading" className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">
        Settlement breakdown
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted [overflow-wrap:anywhere] sm:text-sm">
        {label ?? `${formatPKR(total)} total`}
      </p>

      <div className="mt-4 space-y-5">
        <SettlementProgress progress={progress} />

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Amount distribution</h4>
          <div
            className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
            role="img"
            aria-label="Settlement distribution by amount"
          >
            {slices.map((slice) => (
              <div
                key={slice.label}
                className={`${slice.colorClass} h-full first:rounded-l-full last:rounded-r-full`}
                style={{
                  width: total > 0 ? `${(slice.amount / total) * 100}%` : '0%',
                  minWidth: slice.amount > 0 ? '4px' : '0',
                }}
              />
            ))}
          </div>
          <ul className="mt-2.5 space-y-2">
            {slices.map((slice) => (
              <li key={slice.label} className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
                <span className={`h-2 w-2 shrink-0 rounded-sm ${slice.colorClass}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-ink" title={slice.label}>{slice.label}</span>
                <span className="shrink-0 font-medium tabular-nums text-ink money [overflow-wrap:anywhere]">
                  {formatPKR(slice.amount)}
                </span>
                <span className="w-11 shrink-0 text-right tabular-nums text-muted">
                  {formatPercent(slice.amount, total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-auto border-t border-line pt-3 text-[11px] leading-relaxed text-muted sm:text-xs">
        Amounts reflect the selected run's settlement status breakdown. Overdue labeling requires known settlement terms and sufficient coverage.
      </p>
    </section>
  );
}
