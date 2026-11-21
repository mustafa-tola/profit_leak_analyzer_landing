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
    return items.filter((finding) => {
      if (status !== 'All' && finding.status !== status) return false;
      if (!q) return true;
      return [finding.ruleId, finding.title, finding.courier, finding.status].some((value) =>
        String(value).toLowerCase().includes(q),
      );
    });
  }, [items, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, safePage * PAGE_SIZE);
  const hasFilters = query.trim().length > 0 || status !== 'All';

  const clearFilters = () => {
    setQuery('');
    setStatus('All');
    setPage(1);
  };

  return (
    <section
      aria-labelledby="findings-heading"
      className="min-w-0 overflow-hidden rounded-[14px] border border-line bg-surface shadow-sm"
    >
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Review queue</p>
            <h3 id="findings-heading" className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">
              Exceptions &amp; findings
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{label}</p>
          </div>
          {items.length > 0 ? (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:min-w-[360px] sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <span className="sr-only">Filter findings</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter rule, description, courier…"
                  aria-controls="findings-table"
                  className="form-input py-2 pl-9 text-xs sm:text-sm"
                />
              </label>
              <label className="sm:w-40">
                <span className="sr-only">Filter by status</span>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as FindingStatus | 'All');
                    setPage(1);
                  }}
                  aria-controls="findings-table"
                  className="form-select py-2 text-xs sm:text-sm"
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p aria-live="polite">
            {items.length === 0
              ? 'No findings in this run'
              : `Showing ${filtered.length} of ${items.length} findings`}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md px-2 py-1 font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Clear filters
            </button>
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
            <table id="findings-table" className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">
                Exception findings for the selected analysis run, including rule, evidence, source, amount, and status.
              </caption>
              <thead>
                <tr className="border-b border-line bg-canvas/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3 sm:px-5">Rule</th>
                  <th scope="col" className="px-4 py-3">Description &amp; evidence</th>
                  <th scope="col" className="px-4 py-3">Source</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 sm:pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((finding, index) => (
                  <tr
                    key={`${finding.ruleId}-${finding.title}-${start + index}`}
                    className="align-top transition-colors duration-150 hover:bg-subtle/30 focus-within:bg-subtle/30"
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <span className="inline-flex rounded-md bg-subtle px-2 py-1 font-mono text-[11px] font-semibold text-muted ring-1 ring-inset ring-line/60">
                        {finding.ruleId}
                      </span>
                    </td>
                    <td className="max-w-xl px-4 py-3.5">
                      <p className="line-clamp-2 font-medium leading-snug text-ink [overflow-wrap:anywhere]">
                        {finding.title}
                      </p>
                      {finding.evidence && Object.keys(finding.evidence).length > 0 ? (
                        <details className="group mt-1.5">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-[11px] font-semibold text-accent-ink transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden">
                            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
                            View evidence
                          </summary>
                          <pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-canvas p-3 text-[11px] leading-relaxed text-muted ring-1 ring-line">
                            {JSON.stringify(finding.evidence, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted">No additional evidence fields available.</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted">
                      <div className="font-medium text-ink">{finding.courier}</div>
                      <div className="mt-0.5 text-xs tabular-nums">
                        {finding.orders} item{finding.orders === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-ink money">
                      {formatPKR(finding.amount)}
                    </td>
                    <td className="px-4 py-3.5 sm:pr-5">
                      <FindingStatusPill status={finding.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted sm:px-5 sm:text-sm"
              aria-label="Findings pagination"
            >
              <span className="tabular-nums">
                {start + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous findings page"
                  className="rounded-md border border-line bg-canvas px-2.5 py-1.5 font-medium text-ink transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="tabular-nums">Page {safePage} of {pageCount}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={safePage >= pageCount}
                  aria-label="Next findings page"
                  className="rounded-md border border-line bg-canvas px-2.5 py-1.5 font-medium text-ink transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}

      <div className="flex gap-2.5 border-t border-line bg-warn-soft/30 px-4 py-3 text-[11px] leading-relaxed text-muted sm:px-5 sm:text-xs">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-ink">Provisional findings.</strong> Flagged items are evidence-backed estimates,
          not confirmed financial losses. Verify against courier statements and settlement records before raising a claim.
        </p>
      </div>
    </section>
  );
}
