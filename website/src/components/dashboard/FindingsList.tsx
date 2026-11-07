import { ChevronDown, InfoIcon } from 'lucide-react';
import { findings as sampleFindings, type Finding } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';
import { FindingStatusPill } from './FindingStatusPill';

export function FindingsList({
  items = sampleFindings,
  label = '47 orders · provisional until verified',
}: {
  items?: Finding[];
  label?: string;
}) {
  return (
    <section aria-label="Findings flagged for review" className="min-w-0 rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold text-ink">Flagged for review</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{label}</p>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center sm:px-5">
          <p className="text-sm font-medium text-ink">No exceptions flagged</p>
          <p className="mt-1 text-sm text-muted">This run did not produce exception findings to review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/50 text-xs font-medium uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3 sm:px-5">Rule</th>
                <th scope="col" className="px-4 py-3">Description &amp; evidence</th>
                <th scope="col" className="px-4 py-3">Source</th>
                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                <th scope="col" className="px-4 py-3 sm:pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((f, index) => (
                <tr key={`${f.ruleId}-${f.title}-${index}`} className="align-top">
                  <td className="px-4 py-3 sm:px-5">
                    <span className="inline-flex rounded-md bg-subtle px-2 py-1 font-mono text-xs font-medium text-muted">
                      {f.ruleId}
                    </span>
                  </td>
                  <td className="max-w-xl px-4 py-3">
                    <p className="font-medium leading-snug text-ink [overflow-wrap:anywhere]">{f.title}</p>
                    {f.evidence && Object.keys(f.evidence).length > 0 ? (
                      <details className="group mt-2">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-accent-ink hover:underline [&::-webkit-details-marker]:hidden">
                          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
                          View evidence
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-canvas p-2.5 text-[11px] leading-relaxed text-muted ring-1 ring-line">
                          {JSON.stringify(f.evidence, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <p className="mt-1 text-xs text-muted">No additional evidence fields available for display.</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    <div>{f.courier}</div>
                    <div className="text-xs">{f.orders} item{f.orders === 1 ? '' : 's'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {formatPKR(f.amount)}
                  </td>
                  <td className="px-4 py-3 sm:pr-5">
                    <FindingStatusPill status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 border-t border-line px-4 py-3.5 text-xs leading-relaxed text-muted sm:px-5">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Flagged items are <strong className="font-medium text-ink">provisional and informational</strong>, not confirmed financial losses.
          Verify against courier statements and settlement records before raising a claim.
        </span>
      </div>
    </section>
  );
}
