import { InfoIcon } from 'lucide-react';
import { findings } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';
import { FindingStatusPill } from './FindingStatusPill';

export function FindingsList() {
  return (
    <section aria-label="Findings flagged for review" className="flex flex-col rounded-xl border border-line bg-surface lg:col-span-2">
      <div className="px-5 pt-5">
        <h3 className="font-semibold text-ink">Flagged for review</h3>
        <p className="mt-0.5 text-[12px] text-muted">47 orders · provisional until verified</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {findings.map((f) =>
        <li key={f.ruleId} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted">
              {f.ruleId}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug text-ink">{f.title}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {f.courier} · {f.orders} orders
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[13px] font-semibold text-ink tabular-nums">{formatPKR(f.amount)}</span>
              <FindingStatusPill status={f.status} />
            </div>
          </li>
        )}
      </ul>
      <p className="mt-auto flex gap-2 border-t border-line px-5 py-3.5 text-[11px] leading-relaxed text-muted">
        <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Potential discrepancies are not confirmed losses. Verify against courier statements before raising a claim.
      </p>
    </section>);

}