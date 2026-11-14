import React from 'react';
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatPKR } from '../../utils/currency';

interface DashboardViewProps {
  selected: { runId?: string; sellerId?: string; asOfDate?: string } | null;
}

const moneyStyle = { fontVariantNumeric: 'tabular-nums' as const };

export function DashboardView({ selected }: DashboardViewProps) {
  const hasData = Boolean(selected);

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {hasData && (
        <div className="rounded-xl border border-[#FFE8D1] bg-[#FDF2E3] px-4 py-3 sm:px-5 flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]">
            <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[#92400E]">
              <span className="text-xs font-bold uppercase tracking-wider">PARTIAL_DATA</span>
              Some input records were rejected. Financial totals exclude rejected records.
            </p>
          </div>
          <Button variant="text" size="sm" leftIcon={<ArrowRight className="h-3 w-3" aria-hidden="true" />}>
            View Details
          </Button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<LayoutDashboard className="h-6 w-6" />}
          label="Expected Receivable"
          value="PKR 556,960.00"
          sub="From 116 shipments"
          color="text-[#0A4236]"
          accent="bg-[#DDF5EA]"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Verified Payments"
          value="PKR 488,285.00"
          sub="87.7% of expected"
          color="text-[#0A4236]"
          accent="bg-[#DDF5EA]"
        />
        <KpiCard
          icon={<Clock className="h-6 w-6" />}
          label="Outstanding Receivable"
          value="PKR 68,675.00"
          sub="12.3% pending"
          color="text-[#0A4236]"
          accent="bg-[#FEF3E3]"
        />
        <KpiCard
          icon={<AlertCircle className="h-6 w-6" />}
          label="Potential Discrepancies"
          value="PKR 116,200.00"
          sub="87 exceptions · not a confirmed loss"
          color="text-[#6A2C00]"
          accent="bg-[#FDF2E3]"
          provisional
        />
      </div>

      {hasData ? (
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-6">
          {/* Left column */}
          <div className="lg:col-span-4 space-y-5">
            <Card>
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#0A4236]" aria-hidden="true"><path d="M2 12a10 10 0 1 0 19.5 3.3L20 15.5H12a8 8 0 1 1-10-3.5" opacity=".5" /><path d="M19.5 14a5.5 5.5 0 0 1-4.9 5.4h0C9.6 19.4 8 17.4 8 15c0-2.4 1.8-4.4 4.2-4.9a1 1 0 0 0 .6-1.8l-.7-1A6 6 0 0 1 13 7h0a6 6 0 0 1 6 6z" /></svg>
                  <h2 className="font-display text-base font-semibold text-ink sm:text-lg">COD Settlement Status</h2>
                </div>
                <p className="mt-1 text-sm text-muted">{formatPKR(488285 + 68675)} across all settlement entries</p>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-[#E7EBE6] border border-[#DCE7E3]">
                  <div className="h-full bg-[#0A4236]" style={{ width: '87.7%' }} />
                  <div className="h-full bg-[#F5A623]" style={{ width: '12.3%', minWidth: '3px' }} />
                </div>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0A4236]" aria-hidden="true" />
                      <span className="text-ink font-medium">Verified paid</span>
                    </span>
                    <span className="tabular-nums text-right text-ink">{formatPKR(488285)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#F5A623]" aria-hidden="true" />
                      <span className="text-ink font-medium">Outstanding</span>
                    </span>
                    <span className="tabular-nums text-right text-ink">{formatPKR(68675)}</span>
                  </li>
                </ul>
                <div className="mt-4 grid gap-1 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>87.7%</span>
                    <span>12.3%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
                <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Run Details</h2>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <table className="mt-3 w-full text-sm divide-y divide-[#DCE7E3]">
                  <tbody>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Analysis Status</th>
                      <td className="px-2 py-2.5 text-left">
                        <Badge variant="partial">PARTIAL_DATA</Badge>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Run ID</th>
                      <td className="px-2 py-2.5 text-left font-mono text-ink">{selected?.runId?.slice(0, 8) ?? '—'}</td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Analyzed At</th>
                      <td className="px-2 py-2.5 text-left text-ink">{selected?.asOfDate ?? '—'}</td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Orders</th>
                      <td className="px-2 py-2.5 text-left tabular-nums text-ink">116 records</td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Shipments</th>
                      <td className="px-2 py-2.5 text-left tabular-nums text-ink">116 records</td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Settlements</th>
                      <td className="px-2 py-2.5 text-left tabular-nums text-ink">116 records</td>
                    </tr>
                    <tr>
                      <th className="px-2 py-2.5 text-left font-medium text-muted">Allocations</th>
                      <td className="px-2 py-2.5 text-left tabular-nums text-muted">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <CardFooter>
                <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />} fullWidth>
                  View Run Report
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Middle column */}
          <div className="lg:col-span-4 space-y-5">
            <Card>
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
                <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Courier Comparison</h2>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
                        <th scope="col" className="px-3 py-3">Courier</th>
                        <th scope="col" className="px-3 py-3 text-right">Shipments</th>
                        <th scope="col" className="px-3 py-3 text-right">RTO Rate</th>
                        <th scope="col" className="px-3 py-3 text-right">Cost / Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      <tr>
                        <td className="px-3 py-3.5 font-medium text-ink">TCS</td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-ink">116</td>
                        <td className="px-3 py-3.5 text-right">
                          <Badge variant="partial">4.3%</Badge>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-ink">{formatPKR(135)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-5">
            <Card>
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
                <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Analysis Summary</h2>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-ink">116</p>
                    <p className="text-xs text-muted">Shipments</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-ink">87</p>
                    <p className="text-xs text-muted">Exceptions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-ink">5</p>
                    <p className="text-xs text-muted">Validation Errors</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Full width exceptions */}
          <section className="lg:col-span-12 rounded-[14px] border border-line bg-surface shadow-soft overflow-hidden">
            <div className="border-b border-line bg-[#F7F9F8] px-5 py-4 sm:px-6 sm:py-4.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#92400E]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-base font-semibold text-ink">Exceptions (87)</h2>
                  <p className="text-xs text-muted">Transactions requiring investigation or confirmation.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:min-w-0">
                <div className="relative min-w-[260px] sm:min-w-[340px]">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m21 21 -4.3-4.3" /></svg>
                  <input
                    type="search"
                    placeholder="Search by order, tracking, or description…"
                    className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    aria-label="Search exceptions"
                  />
                </div>
                <Button variant="ghost" size="sm" leftIcon={<svg className="h-3.5 w-3.5" aria-hidden="true"><path d="M3 4h16v2H3zM3 10h16v2H3zM3 16h16v2H3z" /></svg>} aria-label="Filter">
                  Filter
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto border-b border-line">
              <table className="w-full min-w-[820px] text-left text-sm">
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
                  {[
                    { type: 'ADJUSTMENT', orderId: 'ORD-784521', tracking: 'TRK78654321', description: 'Adjustment SET-R0014 of PKR 25.00 (positive = paid to seller, negative = deducted)', source: '1 txn', amount: 25, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
                    { type: 'COD_MISMATCH', orderId: 'ORD-784520', tracking: 'TRK78654320', description: 'Order COD PKR 2,500.00 differs from COD collected across 1 delivered shipment(s)', source: '1 txn', amount: 0, status: 'Provisional', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]' },
                    { type: 'DUE_DATE_UNK', orderId: 'ORD-784519', tracking: 'TRK78654319', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 2850, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
                    { type: 'DUE_DATE_UNK', orderId: 'ORD-784518', tracking: 'TRK78654318', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 3200, status: 'Needs review', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#8A5BF0] bg-[#F3EEFF] text-[#6A2C00]' },
                    { type: 'DUE_DATE_UNK', orderId: 'ORD-784517', tracking: 'TRK78654317', description: 'Overdue status unknown (no rule)', source: '1 txn', amount: 975, status: 'Mismatch', typeBadge: 'border-[#E7A65B] bg-[#FFF4E5] text-[#92400E]', statusBadge: 'border-[#B42318] bg-[#FEF3F2] text-[#B42318]' },
                  ].map((e, i) => (
                    <tr key={`${e.type}-${i}`} className="hover:bg-[#F5F8F7]/50">
                      <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded text-[#0A4236]" aria-label={`Select ${e.type}`} /></td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-ink">{e.orderId}</div>
                        <div className="text-[11px] text-muted">{e.tracking}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${e.typeBadge}`}>{e.type}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[320px]">
                        <p className="font-medium text-ink leading-snug [overflow-wrap:anywhere]">{e.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted">{e.source}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{formatPKR(e.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${e.statusBadge}`}>{e.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right"><ChevronIcon className="h-4 w-4 text-muted" aria-hidden="true" /></td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-muted">
                      Showing 1–5 of 87 exceptions
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-5 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted">Showing 1–5 of 87 exceptions</p>
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
          </section>
        </div>
      ) : (
        <div className="rounded-[14px] border border-dashed border-line bg-surface p-10 lg:p-16 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-[#B8CBD4]" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">No analysis selected</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted max-w-md mx-auto">Start a new reconciliation or open a previous run to view expected vs verified amounts, outstanding receivables, courier comparison, and exceptions.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="sm">Upload &amp; analyze</Button>
            <Button variant="ghost" size="sm">View run history</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, accent, provisional }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; accent: string; provisional?: boolean }) {
  return (
    <Card className={`${provisional ? 'bg-[#FDF9EF]' : ''}`}>
      <CardBody className="pb-4">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent} ${color}`}>{icon}</div>
          <button type="button" className="h-7 w-7 rounded-full border border-transparent text-[#DCE7E3] hover:bg-[#F5F8F7] hover:text-ink transition" aria-label="Info">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><path d="M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
          </button>
        </div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 font-bold tabular-nums text-ink" style={moneyStyle}>{value}</p>
        <p className="mt-0.5 text-sm text-muted">{sub}</p>
        {provisional && <p className="mt-1.5 text-xs text-[#92400E]">Provisional · not a confirmed loss</p>}
      </CardBody>
    </Card>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
