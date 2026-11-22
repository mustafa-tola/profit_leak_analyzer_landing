import { useMemo, useState } from 'react';
import { ChevronDown, Info, Search } from 'lucide-react';
import { findings as sampleFindings, type Finding, type FindingStatus } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';
import { FindingStatusPill } from './FindingStatusPill';
import { findingPresentation } from './findingPresentation';

const PAGE_SIZE = 6;
const SEVERITY_RANK: Record<FindingStatus, number> = { Overdue: 0, 'Needs review': 1, Provisional: 2 };

export function FindingsList({
  items = sampleFindings,
  totalFindings = items.length,
  label = '47 orders · provisional until verified',
}: {
  items?: Finding[];
  totalFindings?: number;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FindingStatus | 'All'>('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((finding) => {
        if (status !== 'All' && finding.status !== status) return false;
        if (!q) return true;
        return [finding.ruleId, finding.title, finding.courier, finding.status, findingPresentation(finding.ruleId).name].some((value) =>
          String(value).toLowerCase().includes(q),
        );
      })
      .sort((a, b) => SEVERITY_RANK[a.status] - SEVERITY_RANK[b.status]);
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
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h4 id="findings-heading" className="font-display text-base font-semibold text-ink sm:text-lg">
              Exceptions &amp; findings
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{label}</p>
          </div>
          {items.length > 0 ? (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto xl:min-w-[360px] sm:flex-row">
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
                  placeholder="Search findings"
                  aria-controls="findings-results"
                  className="form-input min-h-9 border-muted/60 py-2 pl-9 text-xs placeholder:text-muted focus-visible:ring-accent sm:text-sm"
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
                  aria-controls="findings-results"
                  className="form-select min-h-9 border-muted/60 py-2 text-xs focus-visible:ring-accent sm:text-sm"
                >
                  <option value="All">All statuses</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Needs review">Needs review</option>
                  <option value="Provisional">Provisional</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p aria-live="polite">
            {items.length === 0
              ? 'No findings loaded'
              : totalFindings !== items.length
                ? `${filtered.length} of ${items.length} loaded findings match · severity order`
                : `${filtered.length} of ${items.length} findings match · severity order`}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-8 rounded-md px-2 py-1 font-semibold text-accent-ink transition-colors hover:bg-accent-soft/60"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div id="findings-results">
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="font-semibold text-ink">{totalFindings > 0 ? 'No findings loaded' : 'No exceptions flagged'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="font-semibold text-ink">No matching findings</p>
            <p className="mt-1 text-sm text-muted">Try clearing the search or status filter.</p>
          </div>
        ) : (
          <>
            <div
              className="overflow-x-auto focus-visible:outline-offset-[-3px]"
              role="region"
              aria-label="Exception findings table"
              tabIndex={0}
            >
              <table id="findings-table" className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Exception findings ordered by severity, including description, amount, and status.</caption>
                <thead>
                  <tr className="border-b border-line bg-canvas/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="px-3 py-3 sm:px-5">Finding</th>
                    <th scope="col" className="w-[5.25rem] px-2 py-3 text-right sm:w-36 sm:px-4">Amount</th>
                    <th scope="col" className="w-[5rem] px-2 py-3 sm:w-36 sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((finding, index) => {
                    const { name, description } = findingPresentation(finding.ruleId);
                    return (
                      <tr
                        key={`${finding.ruleId}-${finding.title}-${start + index}`}
                        className="align-top transition-colors duration-150 hover:bg-subtle/30 focus-within:bg-subtle/30"
                      >
                        <td className="px-3 py-3 [overflow-wrap:anywhere] sm:px-5">
                          <p className="font-semibold leading-snug text-ink">{name}</p>
                          <p className={`mt-1 text-xs leading-relaxed text-muted ${description ? '' : 'line-clamp-2'}`}>
                            {description || finding.title}
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-muted">
                            {finding.courier} · {finding.orders} item{finding.orders === 1 ? '' : 's'}
                          </p>
                          <details className="group mt-1">
                            <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-md text-xs font-semibold text-accent-ink hover:underline [&::-webkit-details-marker]:hidden">
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
                              <span>Details<span className="sr-only"> for {name}</span></span>
                            </summary>
                            <div className="mt-1 space-y-2 rounded-lg bg-canvas p-2 text-xs leading-relaxed text-muted ring-1 ring-line sm:p-3">
                              <p>Rule <code>{finding.ruleId}</code></p>
                              <p>{finding.title}</p>
                              {finding.evidence ? (
                                <pre
                                  className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-surface p-2 [overflow-wrap:anywhere]"
                                  role="region"
                                  aria-label={`Evidence for ${name}`}
                                  tabIndex={0}
                                >
                                  {JSON.stringify(finding.evidence, null, 2)}
                                </pre>
                              ) : <p>No evidence fields available.</p>}
                            </div>
                          </details>
                        </td>
                        <td className="money px-2 py-3 text-right text-xs font-semibold tabular-nums text-ink [overflow-wrap:anywhere] sm:px-4 sm:text-sm">
                          {formatPKR(finding.amount)}
                        </td>
                        <td className="px-2 py-3 sm:px-5">
                          <FindingStatusPill status={finding.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pageCount > 1 ? (
              <nav
                className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-muted sm:px-6 sm:text-sm"
                aria-label="Findings pagination"
              >
                <span className="tabular-nums">{start + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage <= 1}
                    aria-label="Previous findings page"
                    className="min-h-8 rounded-md border border-muted/60 bg-canvas px-2.5 py-1.5 font-medium text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="tabular-nums">Page {safePage} of {pageCount}</span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={safePage >= pageCount}
                    aria-label="Next findings page"
                    className="min-h-8 rounded-md border border-muted/60 bg-canvas px-2.5 py-1.5 font-medium text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        )}

      </div>

      <div className="flex gap-2.5 border-t border-line bg-warn-soft/30 px-5 py-3 text-[11px] leading-relaxed text-muted sm:px-6 sm:text-xs">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-ink">Provisional findings.</strong> Flagged items are evidence-backed estimates,
          not confirmed financial losses. Verify against courier statements and settlement records before raising a claim.
        </p>
      </div>
    </section>
  );
}
