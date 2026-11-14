import React from 'react';
import { Download, FileCheck, Clock, AlertCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { formatPKR } from '../../utils/currency';

const reportItems = [
  { title: 'COD Reconciliation Report', type: 'PDF', date: '07 Nov 2026, 02:14 PM', icon: <FileCheck className="h-4 w-4" aria-hidden="true" /> },
  { title: 'Courier Performance Report', type: 'PDF', date: '07 Nov 2026, 02:14 PM', icon: <FileCheck className="h-4 w-4" aria-hidden="true" /> },
  { title: 'Exceptions Report (87)', type: 'XLSX', date: '07 Nov 2026, 02:14 PM', icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> },
];

const kpiCards = [
  { label: 'Expected Receivable', value: 'PKR 556,960.00', sub: 'From 116 shipments', icon: <LayoutDashboard className="h-6 w-6" />, color: 'text-[#0A4236]', accent: 'bg-[#DDF5EA]' },
  { label: 'Verified Payments', value: 'PKR 488,285.00', sub: '87.7% of expected', icon: <FileCheck className="h-6 w-6" />, color: 'text-[#0A4236]', accent: 'bg-[#DDF5EA]' },
  { label: 'Outstanding Receivable', value: 'PKR 68,675.00', sub: '12.3% pending', icon: <Clock className="h-6 w-6" />, color: 'text-[#0A4236]', accent: 'bg-[#FEF3E3]' },
  { label: 'Potential Discrepancies', value: 'PKR 116,200.00', sub: '87 exceptions · not a confirmed loss', icon: <AlertCircle className="h-6 w-6" />, color: 'text-[#6A2C00]', accent: 'bg-[#FDF2E3]' },
];

export function ReportsView() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, i) => (
          <ReportKpiCard key={i} {...card} />
        ))}
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-8 space-y-5">
          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Settlement Trend</h2>
              <p className="mt-1 text-sm text-muted">Expected vs. verified payments (daily).</p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="rounded-[14px] border border-line bg-[#F7F9F8] p-6 h-64">
                <div className="flex h-full items-end justify-between gap-1 px-2 pb-4">
                  {['01 Nov', '02 Nov', '03 Nov', '04 Nov', '05 Nov', '06 Nov', '07 Nov'].map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <div className="w-full bg-[#0A4236]/40 rounded-t-[9px]" style={{ height: `${40 + i * 8}%` }} />
                      <div className="w-full bg-[#087F62]/60 rounded-t-[9px]" style={{ height: `${30 + i * 6}%` }} />
                      <span className="text-[10px] text-muted">{day}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-end justify-between text-[10px] text-muted">
                  <span>PKR 0</span>
                  <span>PKR 800K</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#0A4236]" aria-hidden="true" />
                    <span>Expected Receivable</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#087F62]" aria-hidden="true" />
                    <span>Verified Payments</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Courier Performance</h2>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="px-4 py-3">Courier</th>
                      <th scope="col" className="px-4 py-3 text-right">Shipments</th>
                      <th scope="col" className="px-4 py-3 text-right">Verified Payments</th>
                      <th scope="col" className="px-4 py-3 text-right">RTO Rate</th>
                      <th scope="col" className="px-4 py-3 text-right">Cost / Delivered</th>
                      <th scope="col" className="px-4 py-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      { courier: 'TCS', shipments: 116, paid: 488285, rto: '4.3%', cost: 'PKR 135', perf: '87.7%', perfColor: 'text-[#0A4236]' },
                      { courier: 'Leopards', shipments: 72, paid: 302400, rto: '5.1%', cost: 'PKR 142', perf: '86.9%', perfColor: 'text-[#0A4236]' },
                      { courier: 'M&P', shipments: 44, paid: 183600, rto: '3.8%', cost: 'PKR 128', perf: '88.2%', perfColor: 'text-[#0A4236]' },
                    ].map((row) => (
                      <tr key={row.courier} className="hover:bg-[#F5F8F7]/50">
                        <td className="px-4 py-3.5 font-medium text-ink">{row.courier}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink">{row.shipments}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink">{formatPKR(row.paid)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-muted">{row.rto}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink">{row.cost}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-bold tabular-nums ${row.perfColor}`}>{row.perf}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center">
                <Button variant="text" size="sm" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}>
                  View All Couriers →
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Reconciliation Accuracy</h2>
              <p className="mt-1 text-sm text-muted">How well payments matched with expected records.</p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col items-center">
              <div className="relative">
                <svg className="w-32 h-32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" stroke="#DCE7E3" strokeWidth="3" fill="none" />
                  <circle cx="16" cy="16" r="13" stroke="#0A4236" strokeWidth="3" fill="none" strokeDasharray="81.68 11.31" strokeDashoffset="25" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-ink">87.7%</span>
                  <span className="text-xs font-medium text-muted">Matched</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0A4236]" aria-hidden="true" />
                  <span className="text-ink">Matched 87.7%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F5A623]" aria-hidden="true" />
                  <span className="text-muted">Unmatched 12.3%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Outstanding Receivables</h2>
              <p className="mt-1 text-sm text-muted">Pending amounts by age bucket.</p>
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
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Reports</h2>
              <p className="mt-1 text-sm text-muted">Download or schedule financial reports.</p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="space-y-3">
                {reportItems.map((item) => (
                  <ReportRow key={item.title} {...item} />
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button variant="text" size="sm" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}>
                  Export Report
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}>
                  Schedule Report
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted"><a href="#" className="text-[#0A4236] hover:underline">View Report History →</a></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReportKpiCard({ icon, label, value, sub, color, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; accent: string }) {
  return (
    <Card className={`${accent}`}>
      <CardBody className="pb-4">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent} ${color}`}>{icon}</div>
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

function ReportRow({ title, type, date, icon }: { title: string; type: string; date: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-[#F5F8F7] transition">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FBF7] text-[#0A4236]">{icon}</div>
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="text-xs text-muted">{type} · {date}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}>
        Download
      </Button>
    </div>
  );
}
