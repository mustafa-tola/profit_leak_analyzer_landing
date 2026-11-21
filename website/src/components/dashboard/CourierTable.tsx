import { courierComparison as sampleRows, type CourierRow } from '../../data/dashboard';
import { formatPKR } from '../../utils/currency';

export function CourierTable({
  rows: inputRows = sampleRows,
  label = 'September 2026 cohort · RTO calculated on resolved parcels only',
}: {
  rows?: CourierRow[];
  label?: string;
}) {
  const rows = inputRows.map((c) => {
    const resolved = c.shipped - c.inTransit;
    return { ...c, resolved, rto: resolved > 0 ? c.returned / resolved : 0 };
  });
  const maxRto = rows.length ? Math.max(...rows.map((r) => r.rto)) : 0;

  return (
    <section aria-labelledby="courier-heading" className="min-w-0 rounded-[14px] border border-line bg-surface shadow-sm">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Delivery performance</p>
        <h3 id="courier-heading" className="mt-1 font-display text-base font-semibold text-ink sm:text-lg">Courier comparison</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{label}</p>
      </div>
      <div className="mt-4 overflow-x-auto pb-1">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">Courier performance comparison including shipment counts, RTO rate, cost per delivered parcel, and average settlement time.</caption>
          <thead>
            <tr className="border-y border-line bg-canvas/70 text-xs font-semibold uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Courier</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Shipped</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">In transit</th>
              <th scope="col" className="px-3 py-3 font-semibold">
                <abbr title="Returned parcels divided by resolved parcels (delivered plus returned)" className="no-underline decoration-dotted underline-offset-2">RTO rate</abbr>
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Cost / delivered</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Avg. settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => {
              const isHighest = maxRto > 0 && c.rto === maxRto;
              return (
                <tr key={c.courier} className="transition-colors duration-150 hover:bg-subtle/30">
                  <th scope="row" className="px-4 py-3.5 font-semibold text-ink sm:px-5">{c.courier}</th>
                  <td className="px-3 py-3.5 text-right tabular-nums text-ink">{c.shipped.toLocaleString('en-US')}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-muted">{c.inTransit}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <div
                          className={`h-full rounded-full ${isHighest ? 'bg-warn' : 'bg-accent/60'}`}
                          style={{ width: `${Math.min(100, (c.rto / 0.3) * 100)}%` }}
                        />
                      </div>
                      <span className={`tabular-nums ${isHighest ? 'font-semibold text-warn' : 'text-ink'}`}>
                        {(c.rto * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs tabular-nums text-muted">
                        {c.returned}/{c.resolved} resolved
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-ink money">{formatPKR(c.costPerDelivered)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-muted sm:px-5">{c.avgSettleDays.toFixed(1)} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}