import React from 'react';
import { FileCheck, Clock, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatPKR } from '../../utils/currency';

interface SettlementSlice {
  label: string;
  amount: number;
  status: 'settled' | 'pending' | 'overdue' | 'disputed' | 'unknown';
  colorClass: string;
}

const settlementSlices: SettlementSlice[] = [
  { label: 'Verified Paid', amount: 488285, status: 'settled', colorClass: 'bg-[#0A4236]' },
  { label: 'Outstanding', amount: 68675, status: 'pending', colorClass: 'bg-[#F5A623]' },
  { label: 'Overdue', amount: 168900, status: 'overdue', colorClass: 'bg-[#E7A65B]' },
  { label: 'Disputed', amount: 38240, status: 'disputed', colorClass: 'bg-[#92400E]' },
  { label: 'Unmatched', amount: 54700, status: 'unknown', colorClass: 'bg-[#6B7280]' },
];

const settlementTable = [
  { ref: 'SET-R0014', date: '07 Nov 2026', expected: 2500, paid: 25, status: 'Partial', statusColor: 'text-[#92400E]' },
  { ref: 'SET-R0009', date: '06 Nov 2026', expected: 50, paid: 50, status: 'Settled', statusColor: 'text-[#0A4236]' },
  { ref: 'SET-R0008', date: '05 Nov 2026', expected: 15, paid: 15, status: 'Settled', statusColor: 'text-[#0A4236]' },
  { ref: 'SET-BATCH-001', date: '04 Nov 2026', expected: 1200, paid: 0, status: 'Missing', statusColor: 'text-[#B42318]' },
  { ref: 'SET-R0007', date: '03 Nov 2026', expected: 975, paid: 975, status: 'Settled', statusColor: 'text-[#0A4236]' },
];

export function SettlementsView() {
  const total = settlementSlices.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Settlement Value" value={formatPKR(total)} sub="Across all shipments" icon={<FileCheck className="h-5 w-5" />} />
        <StatCard label="Verified Paid" value={formatPKR(488285)} sub="87.7% of expected" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Outstanding" value={formatPKR(68675)} sub="12.3% pending" icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Overdue" value={formatPKR(168900)} sub="Requires action" icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-8 space-y-5">
          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-[#0A4236]" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-ink">Settlement Breakdown</h2>
              </div>
              <p className="mt-1 text-sm text-muted">{formatPKR(total)} across all settlement entries</p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E7EBE6] border border-line ring-1 ring-inset ring-line/60">
                {settlementSlices.map((s) => (
                  <div
                    key={s.label}
                    className={`${s.colorClass} h-full first:rounded-l-full last:rounded-r-full`}
                    style={{ width: total > 0 ? (s.amount / total) * 100 : 0, minWidth: s.amount > 0 ? '4px' : '0' }}
                  />
                ))}
              </div>
              <ul className="mt-5 space-y-3">
                {settlementSlices.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 text-sm">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.colorClass}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
                    <span className="shrink-0 font-medium tabular-nums text-ink">{formatPKR(s.amount)}</span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-muted">
                      {total > 0 ? ((s.amount / total) * 100).toFixed(1) + '%' : '0.0%'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-line pt-4 text-xs leading-relaxed text-muted">
                Amounts reflect settlement status breakdown. Overdue labeling requires known settlement terms and sufficient coverage.
              </p>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Settlement Entries</h2>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="px-4 py-3">Settlement Ref</th>
                      <th scope="col" className="px-4 py-3">Date</th>
                      <th scope="col" className="px-4 py-3 text-right">Expected</th>
                      <th scope="col" className="px-4 py-3 text-right">Paid</th>
                      <th scope="col" className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {settlementTable.map((row) => (
                      <tr key={row.ref} className="hover:bg-[#F5F8F7]/50">
                        <td className="px-4 py-3.5 font-medium text-ink">{row.ref}</td>
                        <td className="px-4 py-3.5 text-sm text-muted">{row.date}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink">{formatPKR(row.expected)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink">{formatPKR(row.paid)}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={row.status === 'Settled' ? 'clean' : row.status === 'Partial' ? 'partial' : 'error'}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted">5 settlement entries displayed</p>
                <Button variant="text" size="sm" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />}>
                  Export entries
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Aging Buckets</h2>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="space-y-3">
                <AgingRow label="0 – 7 days" amount={28400} pct="41.3%" />
                <AgingRow label="8 – 14 days" amount={18275} pct="26.6%" />
                <AgingRow label="15 – 30 days" amount={12000} pct="17.5%" />
                <AgingRow label="> 30 days" amount={10000} pct="14.6%" />
              </div>
              <div className="mt-4 rounded-lg border border-line bg-[#F7F9F8] p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-ink">Total Outstanding</span>
                  <span className="font-bold tabular-nums text-ink">{formatPKR(68675)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Settlement Terms</h2>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <p className="text-sm leading-relaxed text-muted mb-4">Settlement terms are configured per courier. Orders without terms show as unknown due date.</p>
              <div className="space-y-3">
                <TermRow courier="TCS" terms="7 days" avgDays="6.1" />
                <TermRow courier="Leopards" terms="14 days" avgDays="9.4" />
                <TermRow courier="PostEx" terms="5 days" avgDays="4.8" />
                <TermRow courier="Trax" terms="10 days" avgDays="7.2" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="pb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DDF5EA] text-[#0A4236]">{icon}</div>
        </div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 font-bold tabular-nums text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        <p className="mt-0.5 text-sm text-muted">{sub}</p>
      </CardBody>
    </Card>
  );
}

function AgingRow({ label, amount, pct }: { label: string; amount: number; pct: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold tabular-nums text-ink">{formatPKR(amount)}</span>
        <span className="text-xs text-muted">{pct}</span>
      </div>
    </div>
  );
}

function TermRow({ courier, terms, avgDays }: { courier: string; terms: string; avgDays: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line pb-2">
      <span className="text-sm font-medium text-ink">{courier}</span>
      <div className="text-right">
        <p className="text-xs text-muted">{terms}</p>
        <p className="text-xs font-medium text-ink">{avgDays} days avg</p>
      </div>
    </div>
  );
}
