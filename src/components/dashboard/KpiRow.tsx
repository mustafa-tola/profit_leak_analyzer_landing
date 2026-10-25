import { kpis } from '../../data/dashboard';

export function KpiRow() {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
      {kpis.map((k) =>
      <div
        key={k.id}
        className={`rounded-xl border p-4 sm:p-5 ${
        k.emphasis ? 'border-warn/30 bg-warn-soft' : 'border-line bg-surface'}`
        }>
        
          <dt className="flex items-center justify-between gap-2 text-[13px] font-medium text-muted">
            <span className={k.emphasis ? 'text-ink' : ''}>{k.label}</span>
            {k.emphasis &&
          <span className="rounded-full border border-warn/30 px-2 py-0.5 text-[10px] font-semibold text-warn">
                Provisional
              </span>
          }
            {k.note &&
          <a
            href="#metric-definitions"
            className="rounded text-[11px] font-medium text-accent-ink underline-offset-2 hover:underline">
            
                Definition
              </a>
          }
          </dt>
          <dd
          className={`mt-2 font-semibold tracking-tight text-ink tabular-nums ${
          k.emphasis ? 'text-[1.75rem]' : 'text-2xl'}`
          }>
          
            {k.value}
          </dd>
          <dd className={`mt-1 text-[12px] ${k.emphasis ? 'text-warn' : 'text-muted'}`}>{k.detail}</dd>
          {k.note && <dd className="mt-0.5 text-[12px] text-muted">{k.note}</dd>}
        </div>
      )}
    </dl>);

}