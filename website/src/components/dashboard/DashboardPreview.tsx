import React from 'react';
import { CalendarDays, Download, Info, Truck } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { SampleBadge } from '../SampleBadge';
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
  onExport?: () => void;
};

export function DashboardPreview({
  isDark,
  data = sampleDashboardData,
  embedded = false,
  onExport,
}: DashboardPreviewProps) {
  const live = data.source === 'live';
  const rtoDefinition = data.rtoDefinition ?? sampleRtoDefinition;
  const costDefinition = data.costDefinition ?? sampleCostDefinition;

  const body = (
    <article className={`min-w-0 overflow-hidden rounded-2xl border border-line bg-surface ${embedded ? 'shadow-soft' : 'shadow-lift ring-1 ring-white/10'}`}>
      <header className="border-b border-line bg-gradient-to-r from-accent-soft/50 via-surface to-surface px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
                {live ? 'Reconciliation overview' : 'Reconciliation overview'}
              </h2>
              {live && data.analysisQuality ? <QualityBadge quality={data.analysisQuality} /> : null}
              <SampleBadge label={live ? (data.runId ? `Run ${data.runId.slice(0, 8)}` : 'Live run') : 'All figures are sample data'} />
            </div>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
              {live
                ? 'Verified amounts and evidence-backed exceptions for the selected analysis run. Provisional discrepancies require review before action.'
                : 'A preview of the COD reconciliation dashboard. All figures shown are sample data for illustration only.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <MetaChip icon={<CalendarDays className="h-3.5 w-3.5" />} label={live ? (data.asOfDate ? `As of ${data.asOfDate}` : 'Live run') : 'Sep 2026 cohort'} />
              <MetaChip icon={<Truck className="h-3.5 w-3.5" />} label={live ? (data.sellerId ? `Seller ${data.sellerId}` : 'Seller account') : 'All couriers'} />
            </div>
          </div>
          {live ? (
            onExport ? (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover"
              >
                <Download className="h-4 w-4" />
                Export summary CSV
              </button>
            ) : null
          ) : (
            <span
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
              aria-hidden="true"
            >
              <Download className="h-4 w-4" />
              Export report
            </span>
          )}
        </div>
      </header>

      {live && data.qualityMessage ? (
        <div className={`border-b px-4 py-3.5 sm:px-6 ${qualityMessageClass(data.analysisQuality)}`} role="status">
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold text-ink">{qualityLabel(data.analysisQuality)}:</span>{' '}
              <span className="text-muted">{data.qualityMessage}</span>
            </span>
          </p>
        </div>
      ) : null}

      <div className="min-w-0 space-y-5 bg-canvas p-3 sm:p-5 lg:p-6">
        <section aria-labelledby={live ? 'kpis-heading-live' : 'kpis-heading-sample'}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 id={live ? 'kpis-heading-live' : 'kpis-heading-sample'} className="font-display text-base font-semibold text-ink sm:text-lg">
                Financial summary
              </h3>
              <p className="mt-0.5 text-sm text-muted">Expected, verified, and outstanding amounts first; provisional discrepancies are shown separately.</p>
            </div>
          </div>
          <KpiRow items={data.kpis} />
        </section>

        <div className="grid min-w-0 gap-5 lg:grid-cols-3">
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

        <section aria-label="Metric definitions" className="rounded-2xl border border-dashed border-line bg-surface p-4 sm:p-5">
          <h3 className="font-display text-base font-semibold text-ink">How metrics are calculated</h3>
          <dl className="mt-3 grid gap-4 text-sm leading-relaxed md:grid-cols-2">
            <div className="rounded-xl bg-canvas p-4 ring-1 ring-line/60">
              <dt className="font-semibold text-ink">RTO rate</dt>
              <dd className="mt-1 text-muted">{rtoDefinition}</dd>
            </div>
            <div className="rounded-xl bg-canvas p-4 ring-1 ring-line/60">
              <dt className="font-semibold text-ink">Cost per delivered parcel</dt>
              <dd className="mt-1 text-muted">{costDefinition}</dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
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
  if (quality === 'CLEAN') return 'border-accent/20 bg-accent-soft/40';
  if (quality === 'PARTIAL_DATA') return 'border-warn/25 bg-warn-soft/70';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'border-danger/25 bg-danger-soft/70';
  return 'border-line bg-subtle/60';
}

function QualityBadge({ quality }: { quality: string }) {
  const cls =
    quality === 'CLEAN'
      ? 'border-accent/30 bg-accent-soft text-accent-ink'
      : quality === 'PARTIAL_DATA'
        ? 'border-warn/30 bg-warn-soft text-warn'
        : quality === 'NO_VALID_SETTLEMENTS'
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-line bg-subtle text-muted';
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${cls}`} title={qualityLabel(quality)}>
      {quality}
    </span>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1.5 text-xs font-medium text-muted shadow-sm">
      <span className="shrink-0 text-accent" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
