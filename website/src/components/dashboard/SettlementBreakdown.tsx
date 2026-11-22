import { settlementStatus as sampleSlices, type SettlementSlice } from '../../data/dashboard';
import { formatPKR, formatPercent } from '../../utils/currency';
import { SettlementProgress, type SettlementProgressCounts } from './SettlementProgress';

type SettlementBreakdownProps = {
  slices?: SettlementSlice[];
  label?: string;
  progress?: SettlementProgressCounts;
};

type MoneyGroup = { label: string; amount: number; bar: string; dot: string };

export function SettlementBreakdown({ slices = sampleSlices, label, progress }: SettlementBreakdownProps) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const verified = slices
    .filter((slice) => /verified|settled/i.test(slice.label))
    .reduce((sum, slice) => sum + slice.amount, 0);
  const outstanding = slices
    .filter((slice) => /outstanding|not yet due|overdue|disputed|unmatched/i.test(slice.label))
    .reduce((sum, slice) => sum + slice.amount, 0);
  const other = Math.max(0, total - verified - outstanding);

  const groups: MoneyGroup[] = [
    { label: 'Verified / settled', amount: verified, bar: 'bg-accent', dot: 'bg-accent' },
    { label: 'Outstanding receivables', amount: outstanding, bar: 'bg-warn', dot: 'bg-warn' },
    ...(other > 0 ? [{ label: 'Other adjustments', amount: other, bar: 'bg-slate-400 dark:bg-slate-500', dot: 'bg-slate-400 dark:bg-slate-500' }] : []),
  ];

  const moneyDescription = groups.map((group) => `${group.label}: ${formatPKR(group.amount)}`).join(', ');

  return (
    <section
      aria-labelledby="settlement-heading"
      className="min-w-0 rounded-[14px] border border-line bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 id="settlement-heading" className="font-display text-base font-semibold text-ink sm:text-lg">
            Settlement breakdown
          </h4>
          {label && <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{label}</p>}
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-2 xl:gap-8">
        <SettlementProgress progress={progress} />

        <div className="min-w-0 border-t border-line pt-5 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <div className="flex items-baseline justify-between gap-3">
            <h5 className="text-xs font-semibold text-muted">Settlement value</h5>
            <span className="text-[11px] font-medium text-muted">PKR</span>
          </div>
          <p className="money mt-2 whitespace-nowrap font-display text-xl font-semibold leading-none tracking-tight text-ink">
            {formatPKR(total)}
          </p>
          <div
            className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
            role="img"
            aria-label={`Settlement value distribution. ${moneyDescription}.`}
          >
            {groups.map((group) => (
              <div
                key={group.label}
                className={`${group.bar} h-full first:rounded-l-full last:rounded-r-full`}
                style={{ width: total > 0 ? `${(group.amount / total) * 100}%` : '0%' }}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-2.5">
            {groups.map((group) => (
              <li key={group.label} className="flex min-w-0 items-center gap-2 text-xs">
                <span className={`h-2 w-2 shrink-0 rounded-full ${group.dot}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-muted">{group.label}</span>
                <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-ink">{formatPKR(group.amount)}</span>
                <span className="w-11 shrink-0 text-right tabular-nums text-muted">
                  {formatPercent(group.amount, total, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 border-t border-line pt-3 text-[11px] leading-relaxed text-muted sm:text-xs">
        Shipment completeness uses record counts. Settlement value uses rupee amounts from the same run. Overdue labeling requires known settlement terms and sufficient coverage.
      </p>
    </section>
  );
}
