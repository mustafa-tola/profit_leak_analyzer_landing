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
import {
  costDefinition as sampleCostDefinition,
  rtoDefinition as sampleRtoDefinition,
  sampleDashboardData,
  type DashboardData,
} from '../../data/dashboard';

type DashboardPreviewProps = {
  isDark: boolean;
  data?: DashboardData;
  embedded?: boolean;
};

export function DashboardPreview({
  isDark,
  data = sampleDashboardData,
  embedded = false,
}: DashboardPreviewProps) {
  const live = data.source === 'live';
  const rtoDefinition = data.rtoDefinition ?? sampleRtoDefinition;
  const costDefinition = data.costDefinition ?? sampleCostDefinition;

  const body = (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-canvas text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
        <LogoMark size={24} />
        <span className="text-sm font-semibold text-ink">
          {live ? 'Live analysis' : 'Reconciliation overview'}
        </span>
        <div className="ml-0 flex min-w-0 flex-wrap items-center gap-2 sm:ml-3">
          <FilterChip
            icon={<CalendarIcon className="h-3.5 w-3.5" />}
            label={live ? (data.asOfDate ? `As of ${data.asOfDate}` : 'Live run') : 'Sep 2026 cohort'}
          />
          <FilterChip
            icon={<TruckIcon className="h-3.5 w-3.5" />}
            label={live ? (data.sellerId ?? 'Seller') : 'All couriers'}
          />
          {live && data.analysisQuality ? <QualityBadge quality={data.analysisQuality} /> : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SampleBadge label={live ? (data.runId ? `Run ${data.runId.slice(0, 8)}` : 'Live data') : undefined} />
          {!live ? (
            <span
              className="hidden items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white sm:inline-flex"
              aria-hidden="true"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Export report
            </span>
          ) : null}
        </div>
      </div>

      {live && data.qualityMessage ? (
        <div className={`border-b px-4 py-3 text-sm leading-relaxed sm:px-5 ${qualityMessageClass(data.analysisQuality)}`}>
          <span className="font-semibold">{qualityLabel(data.analysisQuality)}:</span> {data.qualityMessage}
        </div>
      ) : null}

      <div className="min-w-0 space-y-4 p-3 sm:p-5">
        <KpiRow items={data.kpis} />
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <ExpenseChart
            isDark={isDark}
            data={data.monthlyExpenses}
            label={data.monthlyExpensesLabel}
            sampleLabel={live ? 'sample preview' : 'sample'}
            demoMode={live}
          />
          <SettlementBreakdown slices={data.settlementStatus} label={data.settlementLabel} />
        </div>
        <CourierTable rows={data.courierComparison} label={data.courierComparisonLabel} />
        <FindingsList items={data.findings} label={data.findingsLabel} />
        <dl
          id={live ? undefined : 'metric-definitions'}
          className="grid gap-4 rounded-xl border border-dashed border-line px-4 py-4 text-sm leading-relaxed sm:px-5 md:grid-cols-2"
        >
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
  );

  if (embedded) return body;

  return (
    <section id="demo" aria-labelledby="demo-heading" className="bg-navy py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeader
          id="demo-heading"
          onDark
          title="Every rupee between checkout and payout"
          description="A preview of the Profit Leak Analyzer dashboard. All figures shown are sample data for illustration only."
          aside={<SampleBadge onDark label="All figures are sample data" />}
        />
        <div className="mt-12">{body}</div>
      </div>
    </section>
  );
}

function qualityLabel(quality?: string): string {
  if (quality === 'CLEAN') return 'Clean analysis';
  if (quality === 'PARTIAL_DATA') return 'Partial data';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'No valid settlements';
  return quality ?? 'Analysis status';
}

function qualityMessageClass(quality?: string): string {
  if (quality === 'CLEAN') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
  if (quality === 'PARTIAL_DATA') return 'border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-300';
  return 'border-line bg-subtle text-muted';
}

function QualityBadge({ quality }: { quality: string }) {
  const cls =
    quality === 'CLEAN'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
      : quality === 'PARTIAL_DATA'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
        : quality === 'NO_VALID_SETTLEMENTS'
          ? 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300'
          : 'border-line bg-canvas text-muted';
  return (
    <span className={`inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide ${cls}`} title={quality}>
      {quality}
    </span>
  );
}

function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted sm:text-[13px]">
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
