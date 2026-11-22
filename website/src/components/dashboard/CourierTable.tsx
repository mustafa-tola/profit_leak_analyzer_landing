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
        <h4 id="courier-heading" className="font-display text-base font-semibold text-ink sm:text-lg">
          {rows.length === 1 ? 'Courier performance' : 'Courier comparison'}
        </h4>
        {rows.length !== 1 && <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{label}</p>}
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
    <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
      <dl className="rounded-lg bg-canvas px-3 py-2.5">
        <dt className="font-semibold text-ink [overflow-wrap:anywhere]">{row.courier}</dt>
        <dd className="mt-1 text-xs leading-relaxed text-muted">
          {row.resolved > 0
            ? `Return to origin (RTO) · ${row.returned} of ${row.resolved} resolved parcels (${(row.rto * 100).toFixed(1)}%)`
            : `Return to origin (RTO) · ${row.resolved} resolved parcels`}
        </dd>
      </dl>
      <dl className="mt-3 grid gap-x-4 gap-y-3 border-t border-line pt-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,6rem),1fr))]">
        <CourierStat label="Shipped" value={row.shipped.toLocaleString('en-US')} />
        <CourierStat label="In transit" value={row.inTransit.toLocaleString('en-US')} />
        <CourierStat label="Cost / delivered" value={formatPKR(row.costPerDelivered)} />
        <CourierStat label="Avg. settlement" value={`${row.avgSettleDays.toFixed(1)} days`} />
      </dl>
    </div>
  );
}

function CourierStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="money mt-1 text-sm font-semibold tabular-nums text-ink [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}
