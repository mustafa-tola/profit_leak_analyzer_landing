import { AlertCircle, Package, Truck } from 'lucide-react';
import type { CourierRow, Finding } from '../../data/dashboard';

interface RunAnalyticsProps {
  couriers: CourierRow[];
  findings: Finding[];
  live: boolean;
  id?: string;
}

function rtoRate(row: CourierRow): number {
  const resolved = row.shipped - row.inTransit;
  return resolved > 0 ? row.returned / resolved : 0;
}

export function RunAnalytics({ couriers, findings, live, id = 'run-analytics-heading' }: RunAnalyticsProps) {
  const shipments = couriers.reduce((sum, row) => sum + row.shipped, 0);
  const inTransit = couriers.reduce((sum, row) => sum + row.inTransit, 0);
  const topVolume = couriers.length
    ? couriers.reduce((best, row) => (row.shipped > best.shipped ? row : best))
    : null;
  const rtoLeader = couriers
    .filter((row) => row.shipped - row.inTransit > 0)
    .reduce<CourierRow | null>((best, row) => (!best || rtoRate(row) > rtoRate(best) ? row : best), null);

  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-[14px] border border-line bg-surface p-4 shadow-sm transition-colors duration-150 hover:bg-subtle/20 sm:p-5 lg:col-span-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">
            Current run
          </p>
          <h3 id={id} className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">
            Run analytics
          </h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
            {live
              ? 'Derived from shipment results in the selected run. No historical trend is inferred.'
              : 'Derived from the sample dataset for illustration only.'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
          <Package className="h-3.5 w-3.5" aria-hidden="true" />
          Single-run view
        </span>
      </div>

      {couriers.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
          No courier-level rows were available in this run.
        </p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <AnalyticStat label="Shipments" value={shipments.toLocaleString('en-US')} />
            <AnalyticStat label="Couriers" value={couriers.length.toLocaleString('en-US')} />
            <AnalyticStat label="In transit" value={inTransit.toLocaleString('en-US')} tone="warn" />
            <AnalyticStat label="Exceptions" value={findings.length.toLocaleString('en-US')} tone="warn" />
          </dl>

          <div className="mt-4 grid gap-3 border-t border-line/80 pt-4 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Highest volume</p>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                <Truck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="truncate">{topVolume?.courier ?? '—'}</span>
                <span className="font-normal tabular-nums text-muted">
                  · {topVolume?.shipped.toLocaleString('en-US') ?? 0} shipments
                </span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Highest RTO rate</p>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
                <span className="truncate">{rtoLeader?.courier ?? '—'}</span>
                <span className="font-normal tabular-nums text-muted">
                  · {rtoLeader ? `${(rtoRate(rtoLeader) * 100).toFixed(1)}% of resolved` : 'no resolved parcels'}
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function AnalyticStat({
  label,
  value,
  tone = 'accent',
}: {
  label: string;
  value: string;
  tone?: 'accent' | 'warn';
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line/70 bg-canvas px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-lg font-semibold tabular-nums ${tone === 'warn' ? 'text-warn' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
