import type { ReactNode } from 'react';
import {
  BadgeCheck,
  Clock3,
  ReceiptText,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wallet,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { kpis as sampleKpis, type Kpi } from '../../data/dashboard';

const iconByKpi: Record<string, ReactNode> = {
  expected: <Wallet className="h-4 w-4" aria-hidden="true" />,
  paid: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
  outstanding: <Clock3 className="h-4 w-4" aria-hidden="true" />,
  discrepancy: <TriangleAlert className="h-4 w-4" aria-hidden="true" />,
  expenses: <TrendingUp className="h-4 w-4" aria-hidden="true" />,
  rto: <Truck className="h-4 w-4" aria-hidden="true" />,
  cost: <ReceiptText className="h-4 w-4" aria-hidden="true" />,
};

export function KpiRow({ items = sampleKpis }: { items?: Kpi[] }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => {
        const provisional = Boolean(k.emphasis);
        const progress = k.progress;
        const barTone =
          progress?.tone === 'danger'
            ? 'bg-danger'
            : progress?.tone === 'warn'
              ? 'bg-warn'
              : 'bg-accent';
        const iconTone = provisional
          ? 'bg-warn-soft text-warn'
          : k.id === 'outstanding'
            ? 'bg-warn-soft text-warn'
            : 'bg-accent-soft text-accent-ink';

        return (
          <div
            key={k.id}
            className={`min-w-0 rounded-[14px] border border-l-[3px] p-4 shadow-sm transition-colors duration-150 hover:bg-subtle/30 sm:p-5 ${
              provisional
                ? 'border-warn/25 border-l-warn bg-warn-soft/40'
                : 'border-line border-l-accent bg-surface'
            }`}
          >
            <dt className="flex min-w-0 items-start justify-between gap-3">
              <span className="flex min-w-0 items-start gap-2.5">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
                  {iconByKpi[k.id] ?? iconByKpi.expected}
                </span>
                <span className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-muted">
                  {k.label}
                </span>
              </span>
              <Badge variant={provisional ? 'partial' : 'neutral'} className="shrink-0">
                {provisional ? 'Provisional' : 'Reported'}
              </Badge>
            </dt>
            <dd
              className="mt-3 font-display text-xl font-semibold leading-tight tracking-tight text-ink money [overflow-wrap:anywhere] sm:text-2xl"
              title={k.value}
            >
              {k.value}
            </dd>
            <dd className="mt-3 text-xs leading-relaxed text-muted">{k.detail}</dd>
            {k.note ? <dd className="mt-1 text-xs leading-relaxed text-muted">{k.note}</dd> : null}
            {progress ? (
              <dd className="mt-4 border-t border-line/70 pt-3">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-subtle"
                  role="progressbar"
                  aria-label={`${k.label}: ${progress.label}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.max(0, Math.min(100, progress.value))}
                >
                  <div
                    className={`h-full rounded-full ${barTone}`}
                    style={{ width: `${Math.max(0, Math.min(100, progress.value))}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium tabular-nums text-muted">{progress.label}</p>
              </dd>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}
