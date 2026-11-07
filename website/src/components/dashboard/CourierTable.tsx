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
  const maxRto = Math.max(...rows.map((r) => r.rto));

  return (
    <section aria-label="Courier comparison" className="min-w-0 rounded-xl border border-line bg-surface">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h3 className="text-base font-semibold text-ink">Courier comparison</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{label}</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-y border-line bg-canvas/60 text-xs font-medium uppercase tracking-wide text-muted">
              <th scope="col" className="px-5 py-2.5 font-medium">Courier</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Shipped</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">In transit</th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                <abbr title="Returned ÷ (delivered + returned)" className="no-underline">RTO rate</abbr>
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Cost / delivered</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Avg. settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => {
              const isHighest = c.rto === maxRto;
              return (
                <tr key={c.courier}>
                  <th scope="row" className="px-5 py-3 font-semibold text-ink">{c.courier}</th>
                  <td className="px-3 py-3 text-right text-ink tabular-nums">{c.shipped.toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 text-right text-muted tabular-nums">{c.inTransit}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full rounded-full ${isHighest ? 'bg-amber-500' : 'bg-ink/40'}`}
                          style={{ width: `${c.rto / 0.3 * 100}%` }} />
                        
                      </div>
                      <span className={`tabular-nums ${isHighest ? 'font-semibold text-warn' : 'text-ink'}`}>
                        {(c.rto * 100).toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-muted tabular-nums">
                        {c.returned}/{c.resolved}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-ink tabular-nums">{formatPKR(c.costPerDelivered)}</td>
                  <td className="px-5 py-3 text-right text-muted tabular-nums">{c.avgSettleDays.toFixed(1)} days</td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </section>);

}