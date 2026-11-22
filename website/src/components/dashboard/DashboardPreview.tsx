import React from 'react';
import { CalendarDays, Download, Info, Truck } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { SampleBadge } from '../SampleBadge';
import { KpiRow } from './KpiRow';
import { ExpenseChart } from './ExpenseChart';
import { RunAnalytics } from './RunAnalytics';
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
    <article className={`min-w-0 overflow-hidden rounded-[14px] border border-line bg-surface ${embedded ? 'shadow-soft' : 'shadow-lift ring-1 ring-white/10'}`}>
      <header className="border-b border-line bg-surface px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
                Reconciliation overview
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
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-[9px] bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-canvas/40 px-4 py-2.5 text-xs sm:px-6">
        <SignalDot tone={qualityTone(data.analysisQuality, live)} label="Data quality" value={qualityShortLabel(data.analysisQuality, live)} />
        <SignalDot
          tone={(data.totalFindings ?? data.findings.length) > 0 ? 'warn' : 'good'}
          label="Exceptions"
          value={`${data.totalFindings ?? data.findings.length} total · ${data.findings.length} loaded`}
        />
        <SignalDot tone={reconciliationTone(data.analysisQuality, data.findings.length, live)} label="Reconciliation" value={reconciliationLabel(data.analysisQuality, data.findings.length, live)} />
        <span className="ml-auto hidden font-medium text-muted sm:inline">{live ? 'Evidence-backed view' : 'Illustrative sample'}</span>
      </div>

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

      <div className="min-w-0 space-y-6 bg-canvas p-4 sm:p-5 lg:p-6">
        <section aria-labelledby={live ? 'financial-heading-live' : 'financial-heading-sample'}>
          <SectionIntro
            id={live ? 'financial-heading-live' : 'financial-heading-sample'}
            title="Financial overview"
            description="Expected, verified, and outstanding amounts first; provisional discrepancies are shown separately."
          />
          <KpiRow items={data.kpis} />
        </section>

        <section aria-labelledby={live ? 'settlement-heading-live' : 'settlement-heading-sample'}>
          <SectionIntro
            id={live ? 'settlement-heading-live' : 'settlement-heading-sample'}
            title="Settlement health"
            description="Shipment counts and settlement amounts for the selected cohort."
          />
          <SettlementBreakdown
            slices={data.settlementStatus}
            label={data.settlementLabel}
            progress={data.settlementProgress}
          />
        </section>

        <section aria-labelledby={live ? 'operations-heading-live' : 'operations-heading-sample'}>
          <SectionIntro
            id={live ? 'operations-heading-live' : 'operations-heading-sample'}
            title="Operational insights"
            description="Exception patterns and courier performance for the selected cohort."
          />
          <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            {live ? (
              <RunAnalytics
                findings={data.findings}
                totalFindings={data.totalFindings ?? data.findings.length}
                id={embedded ? 'run-analytics-embedded' : 'run-analytics-live'}
              />
            ) : (
              <ExpenseChart
                isDark={isDark}
                data={data.monthlyExpenses}
                label={data.monthlyExpensesLabel}
                sampleLabel="sample"
              />
            )}
            <CourierTable rows={data.courierComparison} label={data.courierComparisonLabel} />
          </div>
        </section>

        <section aria-labelledby={live ? 'exceptions-heading-live' : 'exceptions-heading-sample'}>
          <SectionIntro
            id={live ? 'exceptions-heading-live' : 'exceptions-heading-sample'}
            title="Exceptions"
            description="Review evidence-backed items in severity order before raising a claim."
          />
          <FindingsList
            items={data.findings}
            totalFindings={data.totalFindings ?? data.findings.length}
            label={data.findingsLabel}
          />
        </section>

        <aside aria-label="Metric definitions" className="rounded-[14px] border border-dashed border-line bg-surface p-4 sm:p-5">
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
        </aside>
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

type SignalTone = 'good' | 'warn' | 'bad' | 'neutral';

function qualityTone(quality?: string, live = true): SignalTone {
  if (!live) return 'neutral';
  if (quality === 'CLEAN') return 'good';
  if (quality === 'PARTIAL_DATA') return 'warn';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'bad';
  return 'neutral';
}

function qualityShortLabel(quality?: string, live = true): string {
  if (!live) return 'Sample cohort';
  if (quality === 'CLEAN') return 'Complete';
  if (quality === 'PARTIAL_DATA') return 'Partial';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'Evidence gap';
  return quality ?? 'Pending';
}

function reconciliationTone(quality: string | undefined, findings: number, live: boolean): SignalTone {
  if (!live) return 'neutral';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'bad';
  if (quality === 'CLEAN' && findings === 0) return 'good';
  return 'warn';
}

function reconciliationLabel(quality: string | undefined, findings: number, live: boolean): string {
  if (!live) return 'Preview only';
  if (quality === 'NO_VALID_SETTLEMENTS') return 'Evidence gap';
  if (quality === 'CLEAN' && findings === 0) return 'Ready to review';
  return 'Review required';
}

function SectionIntro({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h3 id={id} className="mt-0.5 font-display text-base font-semibold text-ink sm:text-lg">
          {title}
        </h3>
      </div>
      <p className="max-w-xl text-xs leading-relaxed text-muted sm:text-right sm:text-sm">{description}</p>
    </div>
  );
}

function SignalDot({ tone, label, value }: { tone: SignalTone; label: string; value: string }) {
  const dot: Record<SignalTone, string> = {
    good: 'bg-accent',
    warn: 'bg-warn',
    bad: 'bg-danger',
    neutral: 'bg-slate-400 dark:bg-slate-500',
  };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[tone]}`} aria-hidden="true" />
      <span className="font-medium text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </span>
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
      ? 'border-accent/30 bg-accent-soft text-ink'
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
