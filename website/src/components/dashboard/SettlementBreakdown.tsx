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
    <section aria-label="COD settlement status" className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="text-base font-semibold text-ink">COD settlement status</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">{label ?? `${formatPKR(total)} total`}</p>

      <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label="Settlement status distribution">
        {slices.map((s) =>
        <div
          key={s.label}
          className={`${s.colorClass} h-full first:rounded-l-full last:rounded-r-full`}
          style={{ width: `${s.amount / total * 100}%`, minWidth: '3px' }} />

        )}
      </div>

      <ul className="mt-5 space-y-3">
        {slices.map((s) =>
        <li key={s.label} className="flex min-w-0 items-center gap-2 text-[13px]">
            <span className={`h-2 w-2 shrink-0 rounded-sm ${s.colorClass}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-ink" title={s.label}>{s.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-ink [overflow-wrap:anywhere]">{formatPKR(s.amount)}</span>
            <span className="w-11 shrink-0 text-right tabular-nums text-muted">{formatPercent(s.amount, total)}</span>
          </li>
        )}
      </ul>

      <p className="mt-auto border-t border-line pt-4 text-xs leading-relaxed text-muted sm:text-[13px]">
        Overdue is only assigned where a settlement term exists. Orders without terms show as unknown due date.
      </p>
    </section>);

}