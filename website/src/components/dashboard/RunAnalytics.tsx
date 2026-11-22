import { AlertCircle, ChevronDown } from 'lucide-react';
import type { Finding, FindingStatus } from '../../data/dashboard';
import { findingPresentation } from './findingPresentation';

interface RunAnalyticsProps {
  findings: Finding[];
  totalFindings: number;
  id?: string;
}

const SEVERITY: Array<{ status: FindingStatus; label: string; bar: string; dot: string }> = [
  { status: 'Overdue', label: 'Overdue', bar: 'bg-danger', dot: 'bg-danger' },
  { status: 'Needs review', label: 'Needs review', bar: 'bg-warn', dot: 'bg-warn' },
  { status: 'Provisional', label: 'Provisional', bar: 'bg-accent', dot: 'bg-accent' },
];

export function RunAnalytics({ findings, totalFindings, id = 'run-analytics-heading' }: RunAnalyticsProps) {
  const loaded = findings.length;
  const ruleCounts = findings.reduce((counts, finding) => {
    counts.set(finding.ruleId, (counts.get(finding.ruleId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const topRules = [...ruleCounts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const distribution = SEVERITY.map((item) => ({
    ...item,
    count: findings.filter((finding) => finding.status === item.status).length,
  }));
  const described = distribution.map((item) => `${item.label}: ${item.count}`).join(', ');

  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-[14px] border border-line bg-surface p-5 shadow-sm sm:p-6"
    >
      <h4 id={id} className="font-display text-base font-semibold text-ink sm:text-lg">
        Exception distribution
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
        {loaded === totalFindings
          ? `Based on all ${totalFindings} exceptions in this run.`
          : `Charts show only the ${loaded} loaded findings. The full run flagged ${totalFindings} exceptions.`}
      </p>

      {findings.length === 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-soft/40 px-4 py-4 text-sm text-muted">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <p>
            {totalFindings > 0 ? 'No findings are loaded for this run.' : 'No exceptions were flagged in this run.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-x-5 gap-y-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
          <div className="min-w-0">
            <h5 className="text-xs font-semibold text-muted">By severity</h5>
            <div
              className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
              role="img"
              aria-label={`Exception severity distribution across ${loaded} loaded findings. ${described}.`}
            >
              {distribution.map((item) =>
                item.count > 0 ? (
                  <div
                    key={item.status}
                    className={`${item.bar} h-full first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${(item.count / loaded) * 100}%` }}
                    title={`${item.label}: ${item.count} of ${loaded} loaded findings`}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 space-y-2">
              {distribution.map((item) => (
                <li key={item.status} className="flex min-w-0 items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-muted">{item.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{item.count}</span>
                  <span className="w-9 shrink-0 text-right tabular-nums text-muted">
                    {Math.round((item.count / loaded) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h5 className="text-xs font-semibold text-muted">Top rule groups</h5>
            <ul className="mt-2 space-y-1">
              {topRules.map(([rule, count]) => {
                const { name, description } = findingPresentation(rule);
                return (
                  <li key={rule}>
                    <details className="group">
                      <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 rounded-md px-1 text-xs hover:bg-subtle [&::-webkit-details-marker]:hidden">
                        <span className="block min-w-0 flex-1 py-1.5">
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 font-medium text-ink">{name}</span>
                            <span className="font-semibold tabular-nums text-ink">{count}<span className="sr-only"> of {loaded} loaded findings</span></span>
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
                          </span>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                            <span className="block h-full rounded-full bg-accent" style={{ width: `${(count / loaded) * 100}%` }} />
                          </span>
                        </span>
                      </summary>
                      <div className="mx-1 mt-2 rounded-md bg-canvas p-2 text-xs leading-relaxed text-muted">
                        {description && <p>{description}</p>}
                        <p className="break-all">Rule <code>{rule}</code></p>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
