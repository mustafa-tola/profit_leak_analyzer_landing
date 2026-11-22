import { AlertCircle, Package } from 'lucide-react';
import type { CourierRow, Finding, FindingStatus } from '../../data/dashboard';

interface RunAnalyticsProps {
  couriers: CourierRow[];
  findings: Finding[];
  totalFindings: number;
  live: boolean;
  id?: string;
}

const SEVERITY: Array<{ status: FindingStatus; label: string; bar: string; dot: string }> = [
  { status: 'Overdue', label: 'Overdue', bar: 'bg-danger', dot: 'bg-danger' },
  { status: 'Needs review', label: 'Needs review', bar: 'bg-warn', dot: 'bg-warn' },
  { status: 'Provisional', label: 'Provisional', bar: 'bg-accent/70', dot: 'bg-accent' },
];

export function RunAnalytics({ couriers, findings, totalFindings, live, id = 'run-analytics-heading' }: RunAnalyticsProps) {
  const shipments = couriers.reduce((sum, row) => sum + row.shipped, 0);
  const inTransit = couriers.reduce((sum, row) => sum + row.inTransit, 0);
  const topRules = Object.entries(
    findings.reduce<Record<string, number>>((acc, finding) => {
      acc[finding.ruleId] = (acc[finding.ruleId] ?? 0) + 1;
      return acc;
    }, {}),
  )
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Operational insights</p>
          <h3 id={id} className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">
            Exception distribution
          </h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
            {live
              ? 'Grouped by severity from exceptions in the selected run. No historical trend is inferred.'
              : 'Grouped from the sample dataset for illustration only.'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
          <Package className="h-3.5 w-3.5" aria-hidden="true" />
          Single-run view
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-soft/40 px-4 py-4 text-sm text-muted">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-ink">No exceptions flagged.</strong> This run produced no items for triage.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">By severity</h4>
              <span className="text-xs font-semibold tabular-nums text-ink">
                {totalFindings} total exceptions · {findings.length} loaded
              </span>
            </div>
            <div
              className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
              role="img"
              aria-label={`Exception severity distribution across ${findings.length} loaded findings. ${described}.`}
            >
              {distribution.map((item) =>
                item.count > 0 ? (
                  <div
                    key={item.status}
                    className={`${item.bar} h-full first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${(item.count / findings.length) * 100}%` }}
                    title={`${item.label}: ${item.count} of ${findings.length} loaded findings`}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 space-y-2">
              {distribution.map((item) => (
                <li key={item.status} className="flex min-w-0 items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-muted">{item.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{item.count}</span>
                  <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                    {Math.round((item.count / findings.length) * 100)}% of loaded
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Severity breakdown is based on the {findings.length} findings loaded in this view. {totalFindings} total exceptions were flagged across the full run.
            </p>
          </div>

          <div className="min-w-0 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Top rule groups</h4>
            <ul className="mt-3 space-y-2.5">
              {topRules.map(([rule, count]) => {
                const humanLabel = ruleToHumanLabel(rule);
                const finding = findings.find((f) => f.ruleId === rule);
                return (
                  <li key={rule} className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 shrink-0 rounded-md bg-subtle px-2.5 py-1 font-mono text-[11px] font-semibold text-muted ring-1 ring-inset ring-line/60 hover:bg-subtle/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      title={rule}
                    >
                      {humanLabel}
                      <span className="sr-only">Rule code: {rule}</span>
                    </button>
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-accent/60"
                        style={{ width: `${(count / findings.length) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">{count}</span>
                    {finding ? (
                      <span className="ml-1 text-[10px] text-muted" title={finding.title}>
                        {finding.title}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 sm:gap-3">
        <SecondaryStat label="Shipments" value={shipments.toLocaleString('en-US')} />
        <SecondaryStat label="Couriers" value={couriers.length.toLocaleString('en-US')} />
        <SecondaryStat label="In transit" value={inTransit.toLocaleString('en-US')} tone="warn" />
      </dl>
    </section>
  );
}

function ruleToHumanLabel(ruleId: string): string {
  const prefixes: Record<string, string> = {
    SD: 'Settlement delay',
    PV: 'Payout variance',
    CH: 'Charge discrepancy',
    COD: 'COD mismatch',
    UN: 'Unmatched shipment',
    RTO: 'RTO cost',
    FEE: 'Fee discrepancy',
    INV: 'Invalid row',
    ADJ: 'Adjustment present',
    DU: 'Due date unknown',
  };
  const prefix = ruleId.split('-')[0];
  return prefixes[prefix] ?? ruleId;
}

function SecondaryStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <div className="min-w-0 rounded-lg bg-canvas px-3 py-2.5 ring-1 ring-line/60">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-base font-semibold tabular-nums ${tone === 'warn' ? 'text-warn' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
