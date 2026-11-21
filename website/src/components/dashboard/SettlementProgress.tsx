import { Info } from 'lucide-react';
import { formatPercent } from '../../utils/currency';

export type SettlementProgressCounts = {
  settled: number;
  partial: number;
  unsettled: number;
  unknown: number;
};

const SEGMENTS: Array<{ key: keyof SettlementProgressCounts; label: string; stroke: string; dot: string }> = [
  { key: 'settled', label: 'Settled', stroke: 'stroke-[rgb(var(--accent))]', dot: 'bg-accent' },
  { key: 'partial', label: 'Partial / overpaid', stroke: 'stroke-[rgb(var(--warn))]', dot: 'bg-warn' },
  { key: 'unsettled', label: 'Unsettled', stroke: 'stroke-[rgb(var(--danger))]', dot: 'bg-danger' },
  { key: 'unknown', label: 'Unknown / N/A', stroke: 'stroke-[rgb(var(--muted))]', dot: 'bg-slate-400 dark:bg-slate-500' },
];

export function SettlementProgress({ progress }: { progress?: SettlementProgressCounts }) {
  if (!progress) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-line bg-canvas px-3 py-3 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>Shipment-count completeness is available for live runs only.</p>
      </div>
    );
  }

  const total = SEGMENTS.reduce((sum, segment) => sum + progress[segment.key], 0);
  if (total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-3 text-xs text-muted">
        No shipment-count completeness data was recorded for this run.
      </p>
    );
  }

  const description = SEGMENTS.map(
    (segment) => `${segment.label}: ${progress[segment.key]} of ${total}`,
  ).join(', ');
  let offset = 0;
  const arcs = SEGMENTS.map((segment) => {
    const count = progress[segment.key];
    const length = (count / total) * 100;
    const arc = { ...segment, count, length, offset };
    offset += length;
    return arc;
  }).filter((arc) => arc.count > 0);

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Shipment completeness</h4>
        <span className="text-[11px] font-medium text-muted">Counts, not value</span>
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-5">
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" className="stroke-subtle" />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="5"
                pathLength={100}
                strokeDasharray={`${arc.length} ${100 - arc.length}`}
                strokeDashoffset={-arc.offset}
                className={arc.stroke}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-xl font-semibold leading-none tabular-nums text-ink">{total.toLocaleString('en-US')}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted">shipments</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {SEGMENTS.map((segment) => {
            const count = progress[segment.key];
            return (
              <li key={segment.key} className="flex min-w-0 items-center gap-2 text-xs">
                <span className={`h-2 w-2 shrink-0 rounded-full ${segment.dot}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-muted">{segment.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">{count.toLocaleString('en-US')}</span>
                <span className="w-11 shrink-0 text-right tabular-nums text-muted">
                  {formatPercent(count, total, 0)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="sr-only" role="img" aria-label={`Settlement completeness by shipment count. ${description}.`}>
        Settlement completeness by shipment count.
      </p>
    </div>
  );
}
