import { Badge } from '../ui/Badge';
import { kpis as sampleKpis, type Kpi } from '../../data/dashboard';

export function KpiRow({ items = sampleKpis }: { items?: Kpi[] }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => {
        const provisional = Boolean(k.emphasis);
        return (
          <div
            key={k.id}
            className={`min-w-0 rounded-[14px] border p-4 sm:p-5 ${
              provisional
                ? 'border-warn/25 bg-warn-soft/45'
                : 'border-line bg-surface shadow-sm'
            }`}
          >
            <dt className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-muted">{k.label}</span>
              {provisional ? <Badge variant="partial">Provisional</Badge> : null}
            </dt>
            <dd
              className={`mt-3 font-display font-semibold tracking-tight text-ink money [overflow-wrap:anywhere] ${
                provisional ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              }`}
              title={k.value}
            >
              {k.value}
            </dd>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{k.detail}</dd>
            {k.note ? <dd className="mt-1 text-sm leading-relaxed text-muted">{k.note}</dd> : null}
          </div>
        );
      })}
    </dl>
  );
}