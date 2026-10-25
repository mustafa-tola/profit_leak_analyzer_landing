import { motion } from 'framer-motion';
import { FileCheck2Icon } from 'lucide-react';
import { SampleBadge } from './SampleBadge';
import { FindingStatusPill } from './dashboard/FindingStatusPill';
import { findings } from '../data/dashboard';
import { formatPKR } from '../utils/currency';

const footerStats = [
{ label: 'Courier expenses', value: 'PKR 412,860' },
{ label: 'RTO rate', value: '19.2%' },
{ label: 'Overdue COD', value: 'PKR 168,900' }];


export function HeroSummaryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
      className="relative min-w-0">
      
      <figure
        aria-label="Sample reconciliation summary"
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <p className="text-[13px] font-medium text-muted">September 2026 · 1,486 shipped parcels</p>
          <SampleBadge />
        </div>

        <div className="px-5 pb-5 pt-6">
          <p className="text-sm font-medium text-muted">Potential settlement discrepancies</p>
          <p className="mt-1.5 text-4xl font-semibold tracking-tight text-ink tabular-nums">PKR 38,240</p>
          <p className="mt-2 text-[13px] text-warn">47 orders flagged for review — not confirmed losses</p>

          <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
            {findings.slice(0, 3).map((f) =>
            <li key={f.ruleId} className="flex items-center gap-3 px-3.5 py-3">
                <span className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted">
                  {f.ruleId}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{f.title}</p>
                  <p className="text-[12px] text-muted">
                    {f.courier} · {f.orders} orders
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold text-ink tabular-nums">{formatPKR(f.amount)}</span>
                  <FindingStatusPill status={f.status} />
                </div>
              </li>
            )}
          </ul>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-line border-t border-line bg-canvas/60">
          {footerStats.map((s) =>
          <div key={s.label} className="px-4 py-3.5">
              <dt className="text-[11px] text-muted">{s.label}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-ink tabular-nums">{s.value}</dd>
            </div>
          )}
        </dl>
      </figure>

      <div className="absolute -bottom-5 -left-5 hidden items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-soft sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
          <FileCheck2Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[12px] font-semibold text-ink">Evidence attached</p>
          <p className="text-[11px] text-muted">47 source rows cited</p>
        </div>
      </div>
    </motion.div>);

}