import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  Search,
  Filter,
  Eye,
  MoreVertical,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { formatPKR } from '../../utils/currency';

interface ExceptionItem {
  type: string;
  orderId: string;
  tracking: string;
  description: string;
  source: string;
  amount: number;
  status: string;
  typeBadge: string;
  statusBadge: string;
}

const EXCEPTION_STATS = [
  { label: 'Total Exceptions', value: '87', icon: <AlertTriangle className="h-5 w-5" />, color: 'text-[#B42318]', bg: 'bg-[#FEF3F2]' },
  { label: 'Needs Review', value: '12', icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-[#0A4236]', bg: 'bg-[#DDF5EA]' },
  { label: 'Provisional', value: '9', icon: <Clock className="h-5 w-5" />, color: 'text-[#92400E]', bg: 'bg-[#FFF4E5]' },
  { label: 'Mismatch', value: '4', icon: <AlertCircle className="h-5 w-5" />, color: 'text-[#B42318]', bg: 'bg-[#FEF3F2]' },
  { label: 'Resolved', value: '62', icon: <Check className="h-5 w-5" />, color: 'text-[#0A4236]', bg: 'bg-[#DDF5EA]' },
  { label: 'Total Discrepancy', value: 'PKR 116,200.00', icon: <FileSpreadsheet className="h-5 w-5" />, color: 'text-[#0A4236]', bg: 'bg-[#DDF5EA]', isMoney: true },
];

const EXCEPTION_ITEMS: ExceptionItem[] = [
  { type: 'ADJUSTMENT', orderId: 'ORD-784521', tracking: 'TRK78654321', description: 'Adjustment SET-R0014 of PKR 25.00 (positive = paid to seller, negative = deducted)', source: '1 txn', amount: 25, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
  { type: 'COD_MISMATCH', orderId: 'ORD-784520', tracking: 'TRK78654320', description: 'Order COD PKR 2,500.00 differs from COD collected across 1 delivered shipment(s)', source: '1 txn', amount: 0, status: 'Provisional', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]' },
  { type: 'DUE_DATE_UNK', orderId: 'ORD-784519', tracking: 'TRK78654319', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 2850, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
  { type: 'DUE_DATE_UNK', orderId: 'ORD-784518', tracking: 'TRK78654318', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 3200, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
  { type: 'DUE_DATE_UNK', orderId: 'ORD-784517', tracking: 'TRK78654317', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 975, status: 'Mismatch', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#B42318] bg-[#FEF3F2] text-[#B42318]' },
  { type: 'ADJUSTMENT', orderId: 'ORD-784516', tracking: 'TRK78654316', description: 'Adjustment SET-R0009 of PKR 50.00 (negative = deducted)', source: '1 txn', amount: 50, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
  { type: 'COD_MISMATCH', orderId: 'ORD-784515', tracking: 'TRK78654315', description: 'Order COD PKR 1,200.00 differs from COD collected', source: '1 txn', amount: 1200, status: 'Provisional', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]' },
  { type: 'ADJUSTMENT', orderId: 'ORD-784514', tracking: 'TRK78654314', description: 'Adjustment SET-R0008 of PKR 15.00 (positive = paid)', source: '1 txn', amount: 15, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
];

export function ExceptionsView() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = useMemo(() => {
    return EXCEPTION_ITEMS.filter((e) => {
      const q = query.trim().toLowerCase();
      if (statusFilter !== 'All' && e.status !== statusFilter) return false;
      if (typeFilter !== 'All' && e.type !== typeFilter) return false;
      if (!q) return true;
      return [e.type, e.description, e.source, e.status].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [query, statusFilter, typeFilter]);

  const statusOptions = ['All', 'Needs review', 'Provisional', 'Mismatch', 'Resolved'];
  const typeOptions = ['All', 'ADJUSTMENT', 'COD_MISMATCH', 'DUE_DATE_UNK'];

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {EXCEPTION_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-line bg-[#F7F9F8] px-5 py-4 sm:px-6 sm:py-4.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#92400E]" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Exceptions ({filtered.length})</h2>
            <p className="text-xs text-muted">Transactions requiring investigation or confirmation.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:min-w-0">
          <div className="relative min-w-[260px] sm:min-w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order, tracking, or description…"
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              aria-label="Search exceptions"
            />
          </div>
          <SelectFilter label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <SelectFilter label="Type" value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              setQuery('');
              setStatusFilter('All');
              setTypeFilter('All');
            }} leftIcon={<svg className="h-3.5 w-3.5" aria-hidden="true"><path d="M3 4h16v2H3zM3 10h16v2H3zM3 16h16v2H3z" /></svg>} aria-label="Reset filters">
              Reset
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />}>
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-line rounded-lg bg-surface shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3 w-8"><input type="checkbox" className="h-4 w-4 rounded text-[#0A4236]" aria-label="Select all" /></th>
              <th scope="col" className="px-4 py-3">Order ID / Tracking</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Description &amp; Evidence</th>
              <th scope="col" className="px-4 py-3 text-right">Source</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3 sm:pr-5">Status</th>
              <th scope="col" className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-ink">No exceptions found</p>
                  <p className="mt-1 text-sm text-muted">Try clearing the search or status filter.</p>
                </td>
              </tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={`${e.type}-${i}`} className="hover:bg-[#F5F8F7]/50 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded text-[#0A4236]" aria-label={`Select ${e.type}`} /></td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-ink">{e.orderId}</div>
                    <div className="text-[11px] text-muted">{e.tracking}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${e.typeBadge}`}>{e.type}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[360px]">
                    <p className="font-medium text-ink leading-snug [overflow-wrap:anywhere]">{e.description}</p>
                    <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline" aria-label={`View details for ${e.orderId}`}>
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View details
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted">{e.source}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{formatPKR(e.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${e.statusBadge}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right"><MoreVertical className="h-4 w-4 text-muted" aria-hidden="true" /></td>
                </tr>
              ))
            )}
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted">
                Showing 1–{Math.min(5, filtered.length)} of {filtered.length} exceptions
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-5 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-muted">Showing 1–5 of {filtered.length} exceptions</p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">Rows per page</label>
          <select className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30">
            <option>5</option>
            <option>10</option>
            <option>25</option>
          </select>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>‹</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="ghost" size="sm">2</Button>
            <Button variant="ghost" size="sm">3</Button>
            <Button variant="ghost" size="sm" className="px-2">…</Button>
            <Button variant="ghost" size="sm">18</Button>
            <Button variant="ghost" size="sm">›</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, isMoney }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string; isMoney?: boolean }) {
  return (
    <Card>
      <CardBody className="pb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
        </div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 font-bold tabular-nums text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        {isMoney && <p className="mt-0.5 text-xs text-[#92400E]">Provisional · not a confirmed loss</p>}
      </CardBody>
    </Card>
  );
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#B8CBD4]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
