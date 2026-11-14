import { kpis as sampleKpis, type Kpi } from '../../data/dashboard';

export function KpiRow({ items = sampleKpis }: { items?: Kpi[] }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => (
        <div
          key={k.id}
          className={`min-w-0 rounded-xl border p-4 sm:p-5 ${
            k.emphasis ? 'border-warn/25 bg-warn-soft/50' : 'border-line bg-surface shadow-sm'
          }`}
        >
          <dt className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-sm font-medium text-muted">
            <span className="min-w-0 flex-1 text-ink">{k.label}</span>
            {k.emphasis ? (
              <span className="shrink-0 rounded-full border border-warn/30 bg-surface/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn">
                Provisional
              </span>
            ) : null}
          </dt>
          <dd
            className={`mt-3 font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere] ${
              k.emphasis ? 'text-lg text-ink sm:text-xl' : 'text-xl text-ink sm:text-2xl'
            }`}
            title={k.value}
          >
            {k.value}
          </dd>
          <dd className={`mt-1.5 text-sm leading-relaxed ${k.emphasis ? 'text-muted' : 'text-muted'}`}>{k.detail}</dd>
          {k.note ? <dd className="mt-1 text-sm leading-relaxed text-muted">{k.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}