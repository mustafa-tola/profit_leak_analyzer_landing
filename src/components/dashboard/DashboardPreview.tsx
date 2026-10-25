import React from 'react';
import { CalendarIcon, DownloadIcon, TruckIcon } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { SampleBadge } from '../SampleBadge';
import { LogoMark } from '../Logo';
import { KpiRow } from './KpiRow';
import { ExpenseChart } from './ExpenseChart';
import { SettlementBreakdown } from './SettlementBreakdown';
import { CourierTable } from './CourierTable';
import { FindingsList } from './FindingsList';
import { costDefinition, rtoDefinition } from '../../data/dashboard';

type DashboardPreviewProps = {isDark: boolean;};

export function DashboardPreview({ isDark }: DashboardPreviewProps) {
  return (
    <section id="demo" aria-labelledby="demo-heading" className="bg-navy py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeader
          id="demo-heading"
          onDark
          title="Every rupee between checkout and payout"
          description="A preview of the Profit Leak Analyzer dashboard. All figures shown are sample data for illustration only."
          aside={<SampleBadge onDark label="All figures are sample data" />} />
        

        <div className="mt-12 overflow-hidden rounded-2xl bg-canvas text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
            <LogoMark size={24} />
            <span className="text-sm font-semibold text-ink">Reconciliation overview</span>
            <div className="ml-0 flex flex-wrap items-center gap-2 sm:ml-3">
              <FilterChip icon={<CalendarIcon className="h-3.5 w-3.5" />} label="Sep 2026 cohort" />
              <FilterChip icon={<TruckIcon className="h-3.5 w-3.5" />} label="All couriers" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SampleBadge />
              <span
                className="hidden items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white sm:inline-flex"
                aria-hidden="true">
                
                <DownloadIcon className="h-3.5 w-3.5" />
                Export report
              </span>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            <KpiRow />
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
              <ExpenseChart isDark={isDark} />
              <SettlementBreakdown />
            </div>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
              <CourierTable />
              <FindingsList />
            </div>
            <dl
              id="metric-definitions"
              className="grid gap-4 rounded-xl border border-dashed border-line px-5 py-4 text-[12px] leading-relaxed md:grid-cols-2">
              
              <div>
                <dt className="font-semibold text-ink">How RTO rate is calculated</dt>
                <dd className="mt-1 text-muted">{rtoDefinition}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">How cost per delivered parcel is calculated</dt>
                <dd className="mt-1 text-muted">{costDefinition}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>);

}

function FilterChip({ icon, label }: {icon: React.ReactNode;label: string;}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-canvas px-2.5 py-1 text-[12px] font-medium text-muted">
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>);

}