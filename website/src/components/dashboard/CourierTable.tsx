import { courierComparison as sampleRows, type CourierRow } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';

type EnrichedRow = CourierRow & { resolved: number; rto: number };

export function CourierTable({
  rows: inputRows = sampleRows,
  label = 'September 2026 cohort · RTO calculated on resolved parcels only',
}: {
  rows?: CourierRow[];
  label?: string;
}) {
  const rows: EnrichedRow[] = inputRows.map((row) => {
    const resolved = row.shipped - row.inTransit;
    return { ...row, resolved, rto: resolved > 0 ? row.returned / resolved : 0 };
  });

  return (
    <section aria-labelledby="courier-heading" className="min-w-0 rounded-[14px] border border-line bg-surface shadow-sm">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Operational insights</p>
        <h3 id="courier-heading" className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">
          {rows.length === 1 ? 'Courier performance' : 'Courier comparison'}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{label}</p>
      </div>

      {rows.length === 0 ? (
        <p className="mx-5 mb-5 mt-4 rounded-lg border border-dashed border-line bg-canvas px-4 py-6 text-center text-sm text-muted sm:mx-6">
          No courier-level rows were available in this run.
        </p>
      ) : rows.length === 1 ? (
        <SingleCourier row={rows[0]} />
      ) : (
        <div
          className="mt-4 overflow-x-auto pb-1"
          role="region"
          aria-label="Courier comparison table"
          tabIndex={0}
        >
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">Courier performance comparison including shipment counts, RTO rate, cost per delivered parcel, and average settlement time.</caption>
            <thead>
              <tr className="border-y border-line bg-canvas/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-semibold sm:px-6">Courier</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Shipped</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">In transit</th>
                <th scope="col" className="px-3 py-3 font-semibold">RTO rate</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Cost / delivered</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">Avg. settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => {
                return (
                  <tr key={row.courier} className="transition-colors duration-150 hover:bg-subtle/30">
                    <th scope="row" className="px-5 py-4 font-semibold text-ink sm:px-6">{row.courier}</th>
                    <td className="px-3 py-4 text-right tabular-nums text-ink">{row.shipped.toLocaleString('en-US')}</td>
                    <td className="px-3 py-4 text-right tabular-nums text-muted">{row.inTransit}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="tabular-nums font-semibold text-ink"
                          title={`${row.returned} returned of ${row.resolved} resolved parcels (${(row.rto * 100).toFixed(1)}% RTO rate)`}
                        >
                          {(row.rto * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs tabular-nums text-muted" title="RTO rate = returned parcels ÷ resolved parcels">
                          {row.returned} returned ÷ {row.resolved} resolved
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums text-ink money">{formatPKR(row.costPerDelivered)}</td>
                    <td className="px-5 py-4 text-right tabular-nums text-muted sm:px-6">{row.avgSettleDays.toFixed(1)} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SingleCourier({ row }: { row: EnrichedRow }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-[12px] bg-canvas p-4 ring-1 ring-line/70 sm:p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Only carrier in this run</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{row.courier}</p>
          <p className="mt-1 text-xs text-muted" title="RTO rate = returned parcels ÷ resolved parcels">
            {row.returned} of {row.resolved} resolved parcels returned ({(row.rto * 100).toFixed(1)}% RTO)
          </p>
        </div>
        <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line/60">
          {(row.rto * 100).toFixed(1)}% RTO
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CourierStat label="Shipped" value={row.shipped.toLocaleString('en-US')} />
        <CourierStat label="In transit" value={row.inTransit.toLocaleString('en-US')} tone="warn" />
        <CourierStat label="Cost / delivered" value={formatPKR(row.costPerDelivered)} />
        <CourierStat label="Avg. settlement" value={`${row.avgSettleDays.toFixed(1)} days`} />
      </dl>
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-muted">Resolved parcel outcome</span>
          <span className="tabular-nums font-semibold text-ink">{row.resolved.toLocaleString('en-US')}</span>
        </div>
        <p className="mt-1 text-xs text-muted" title="RTO rate = returned parcels ÷ resolved parcels">
          {row.returned} returned ÷ {row.resolved} resolved = {(row.rto * 100).toFixed(1)}% RTO
        </p>
      </div>
    </div>
  );
}

function CourierStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warn' }) {
  return (
    <div className="min-w-0 rounded-lg bg-canvas px-3 py-3 ring-1 ring-line/60">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`money mt-1.5 whitespace-nowrap font-display text-sm font-semibold tabular-nums sm:text-base ${tone === 'warn' ? 'text-warn' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
