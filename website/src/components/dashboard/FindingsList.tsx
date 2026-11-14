import { useMemo, useState } from 'react';
import { ChevronDown, Info, Search } from 'lucide-react';
import { findings as sampleFindings, type Finding, type FindingStatus } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';
import { FindingStatusPill } from './FindingStatusPill';

const PAGE_SIZE = 8;

export function FindingsList({
  items = sampleFindings,
  label = '47 orders · provisional until verified',
}: {
  items?: Finding[];
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FindingStatus | 'All'>('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (status !== 'All' && f.status !== status) return false;
      if (!q) return true;
      return [f.ruleId, f.title, f.courier, f.status].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section aria-labelledby="findings-heading" className="min-w-0 rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 id="findings-heading" className="font-display text-base font-semibold text-ink">Exceptions &amp; findings</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{label}</p>
          </div>
          {items.length > 0 ? (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:min-w-[360px] sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <span className="sr-only">Filter findings</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Filter rule, description, courier…"
                  className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="sm:w-44">
                <span className="sr-only">Filter by status</span>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as FindingStatus | 'All'); setPage(1); }}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="All">All statuses</option>
                  <option value="Provisional">Provisional</option>
                  <option value="Needs review">Needs review</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="font-semibold text-ink">No exceptions flagged</p>
          <p className="mt-1 text-sm text-muted">This run did not produce exception findings to review.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="font-semibold text-ink">No matching findings</p>
          <p className="mt-1 text-sm text-muted">Try clearing the search or status filter.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Exception findings for the selected analysis run, including rule, evidence, source, amount, and status.</caption>
              <thead>
                <tr className="border-b border-line bg-canvas/70 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3 sm:px-5">Rule</th>
                  <th scope="col" className="px-4 py-3">Description &amp; evidence</th>
                  <th scope="col" className="px-4 py-3">Source</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 sm:pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((f, index) => (
                  <tr key={`${f.ruleId}-${f.title}-${(safePage - 1) * PAGE_SIZE + index}`} className="align-top hover:bg-subtle/20">
                    <td className="px-4 py-4 sm:px-5">
                      <span className="inline-flex rounded-lg bg-subtle px-2 py-1 font-mono text-xs font-semibold text-muted ring-1 ring-inset ring-line/60">
                        {f.ruleId}
                      </span>
                    </td>
                    <td className="max-w-xl px-4 py-4">
                      <p className="font-medium leading-snug text-ink [overflow-wrap:anywhere]">{f.title}</p>
                      {f.evidence && Object.keys(f.evidence).length > 0 ? (
                        <details className="group mt-2">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-xs font-semibold text-accent-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden">
                            <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
                            View evidence
                          </summary>
                          <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-canvas p-3 text-[11px] leading-relaxed text-muted ring-1 ring-line">
                            {JSON.stringify(f.evidence, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <p className="mt-1.5 text-xs text-muted">No additional evidence fields available for display.</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-muted">
                      <div className="font-medium text-ink">{f.courier}</div>
                      <div className="mt-0.5 text-xs">{f.orders} item{f.orders === 1 ? '' : 's'}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-ink money">
                      {formatPKR(f.amount)}
                    </td>
                    <td className="px-4 py-4 sm:pr-5">
                      <FindingStatusPill status={f.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:px-5" aria-label="Findings pagination">
              <span>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-line bg-canvas px-3 py-1.5 font-medium text-ink transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="tabular-nums">Page {safePage} of {pageCount}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage >= pageCount}
                  className="rounded-lg border border-line bg-canvas px-3 py-1.5 font-medium text-ink transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}

      <div className="flex gap-2.5 border-t border-line bg-warn-soft/30 px-4 py-3.5 text-xs leading-relaxed text-muted sm:px-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-ink">Provisional findings.</strong> Flagged items are evidence-backed estimates, not confirmed
          financial losses. Verify against courier statements and settlement records before raising a claim.
        </p>
      </div>
    </section>
  );
}
