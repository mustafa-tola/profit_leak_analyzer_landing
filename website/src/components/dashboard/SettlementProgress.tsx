import { Info } from 'lucide-react';
import { formatPercent } from '../../utils/currency';

export type SettlementProgressCounts = {
  settled: number;
  partial: number;
  unsettled: number;
  unknown: number;
};

const SEGMENTS: Array<{ key: keyof SettlementProgressCounts; label: string; color: string }> = [
  { key: 'settled', label: 'Settled', color: 'bg-accent' },
  { key: 'partial', label: 'Partial / overpaid', color: 'bg-warn' },
  { key: 'unsettled', label: 'Unsettled', color: 'bg-danger' },
  { key: 'unknown', label: 'Unknown / N/A', color: 'bg-slate-400 dark:bg-slate-500' },
];

export function SettlementProgress({ progress }: { progress?: SettlementProgressCounts }) {
  if (!progress) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-line bg-canvas px-3 py-2.5 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>Shipment-count completeness is shown for live runs only.</p>
      </div>
    );
  }

  const total = SEGMENTS.reduce((sum, segment) => sum + progress[segment.key], 0);
  if (total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-2.5 text-xs text-muted">
        No shipment-count completeness data was recorded for this run.
      </p>
    );
  }

  const description = SEGMENTS.map(
    (segment) => `${segment.label}: ${progress[segment.key]} of ${total}`,
  ).join(', ');

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Shipment completeness
        </h4>
        <span className="text-[11px] font-medium tabular-nums text-muted">
          {total.toLocaleString('en-US')} shipments
        </span>
      </div>

      <div
        className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line/60"
        role="img"
        aria-label={`Settlement completeness by shipment count. ${description}.`}
      >
        {SEGMENTS.map((segment) => {
          const count = progress[segment.key];
          if (count <= 0) return null;
          return (
            <div
              key={segment.key}
              className={`${segment.color} h-full first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          );
        })}
      </div>

      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {SEGMENTS.map((segment) => {
          const count = progress[segment.key];
          return (
            <li key={segment.key} className="flex min-w-0 items-center gap-1.5 text-[11px]">
              <span className={`h-2 w-2 shrink-0 rounded-sm ${segment.color}`} aria-hidden="true" />
              <span className="min-w-0 truncate text-muted">{segment.label}</span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink">{count.toLocaleString('en-US')}</span>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                {formatPercent(count, total, 0)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
