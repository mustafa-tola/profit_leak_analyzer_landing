import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { formatPKR } from '../../utils/currency';
import type { PublicAnalysisRun } from '../../lib/api';

interface ExceptionsViewProps {
  run: PublicAnalysisRun | null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
function paisaToRupees(value: unknown): number {
  if (typeof value === 'number') return value / 100;
  if (typeof value === 'string') { const n = Number(value.replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n / 100 : 0; }
  return 0;
}

function badgeVariant(status: string): 'clean' | 'partial' | 'error' | 'neutral' | 'info' {
  const s = status.toLowerCase();
  if (s.includes('provisional')) return 'partial';
  if (s.includes('overdue')) return 'error';
  if (s.includes('review')) return 'neutral';
  return 'partial';
}

export function ExceptionsView({ run }: ExceptionsViewProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const items = useMemo(() => {
    const exceptions = asArray(run?.result?.exceptions);
    return exceptions.map((raw, i) => {
      const ex = asRecord(raw) ?? {};
      return {
        id: i,
        type: String(ex.type ?? ex.exception_type ?? 'EXCEPTION'),
        description: String(ex.description ?? ex.message ?? ex.type ?? 'Exception flagged'),
        orderId: ex.order_id != null ? String(ex.order_id) : '—',
        tracking: ex.tracking_number != null ? String(ex.tracking_number) : '—',
        amount: Math.max(0, Math.round(paisaToRupees(ex.amount_paisa ?? ex.impact_paisa ?? ex.delta_paisa))),
        status: String(ex.severity ?? ex.due_date_status ?? 'Needs review'),
        courier: ex.courier != null ? String(ex.courier) : '—',
      };
    });
  }, [run]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      if (status !== 'All' && !e.status.toLowerCase().includes(status.toLowerCase()) && status !== e.status) return false;
      if (!q) return true;
      return [e.type, e.description, e.orderId, e.tracking, e.courier, e.status].some((v) => v.toLowerCase().includes(q));
    });
  }, [items, query, status]);

  if (!run) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
        <h2 className="mt-3 font-display text-lg font-semibold text-ink">No analysis selected</h2>
        <p className="mt-1 text-sm text-muted">Open a run from Dashboard or History to review exceptions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Exceptions</h2>
          <p className="mt-1 text-sm text-muted">{items.length} flagged item{items.length === 1 ? '' : 's'} for run {run.run_id.slice(0, 8)} · provisional, not confirmed losses.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exceptions…" className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:w-64" aria-label="Search exceptions" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" aria-label="Filter status">
            <option value="All">All statuses</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="OVERDUE">Overdue</option>
            <option value="REVIEW">Needs review</option>
          </select>
        </div>
      </div>

      <div className="table-wrap overflow-x-auto">
        <table className="table min-w-[820px]">
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Order / Tracking</th>
              <th scope="col" className="px-4 py-3">Description</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">{items.length === 0 ? 'No exceptions flagged in this run.' : 'No matching exceptions.'}</td></tr>
            ) : filtered.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-4 py-3"><span className="inline-flex rounded-md bg-subtle px-2 py-1 font-mono text-xs font-medium text-muted">{e.type}</span></td>
                <td className="px-4 py-3 text-sm text-muted"><div className="font-medium text-ink">{e.orderId}</div><div className="text-xs">{e.tracking}</div></td>
                <td className="px-4 py-3 font-medium text-ink [overflow-wrap:anywhere]">{e.description}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatPKR(e.amount)}</td>
                <td className="px-4 py-3"><Badge variant={badgeVariant(e.status)}>{e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
