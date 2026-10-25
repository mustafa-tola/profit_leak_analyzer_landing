import { settlementStatus } from '../../data/dashboard';
import { formatPKR, formatPercent } from '../../utils/currency';

export function SettlementBreakdown() {
  const total = settlementStatus.reduce((sum, s) => sum + s.amount, 0);

  return (
    <section aria-label="COD settlement status" className="flex flex-col rounded-xl border border-line bg-surface p-5">
      <h3 className="font-semibold text-ink">COD settlement status</h3>
      <p className="mt-0.5 text-[12px] text-muted">{formatPKR(total)} across 1,152 delivered orders</p>

      <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label="Settlement status distribution">
        {settlementStatus.map((s) =>
        <div
          key={s.label}
          className={`${s.colorClass} h-full first:rounded-l-full last:rounded-r-full`}
          style={{ width: `${s.amount / total * 100}%`, minWidth: '3px' }} />

        )}
      </div>

      <ul className="mt-5 space-y-3">
        {settlementStatus.map((s) =>
        <li key={s.label} className="flex items-center gap-2.5 text-[13px]">
            <span className={`h-2 w-2 shrink-0 rounded-sm ${s.colorClass}`} aria-hidden="true" />
            <span className="text-ink">{s.label}</span>
            <span className="ml-auto font-medium text-ink tabular-nums">{formatPKR(s.amount)}</span>
            <span className="w-11 text-right text-muted tabular-nums">{formatPercent(s.amount, total)}</span>
          </li>
        )}
      </ul>

      <p className="mt-auto border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
        Overdue is only assigned where a settlement term exists. Orders without terms show as unknown due date.
      </p>
    </section>);

}