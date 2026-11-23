import { SettlementBreakdown } from '../../components/dashboard/SettlementBreakdown';
import { toDashboardData } from '../../lib/analysis-adapter';
import type { PublicAnalysisRun } from '../../lib/api';

interface SettlementsViewProps {
  run: PublicAnalysisRun | null;
}

export function SettlementsView({ run }: SettlementsViewProps) {
  if (!run) {
    return (
      <div className="empty-state">
        <h2 className="mt-4 font-display text-lg font-semibold text-ink">No analysis selected</h2>
        <p className="mt-1 text-sm text-muted">Open a run from Dashboard or History to view settlement details.</p>
      </div>
    );
  }

  const data = toDashboardData(run);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Settlements</h2>
        <p className="mt-1 text-sm text-muted">Settlement breakdown for run {run.run_id.slice(0, 8)} ({run.analysis_quality}).</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SettlementBreakdown slices={data.settlementStatus} label={data.settlementLabel} progress={data.settlementProgress} />
        <div className="card p-5">
          <h3 className="font-display text-base font-semibold text-ink">Run KPIs</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {Object.entries(run.kpis_pkr).map(([k, v]) => {
              const labelMap: Record<string, string> = {
                expected_receivable_pkr: 'Expected receivable',
                verified_paid_pkr: 'Verified payments',
                verified_paid_paisa_pkr: 'Verified payments',
                outstanding_receivable_pkr: 'Outstanding receivables',
                potential_exposure_pkr: 'Provisional discrepancy estimate',
                total_adjustment_pkr: 'Net adjustments',
                allocated_adjustment_pkr: 'Allocated adjustments',
                unallocated_adjustment_pkr: 'Unallocated adjustments',
                verified_paid_non_delivered_pkr: 'Verified payments on undelivered shipments',
                rto_operational_cost_pkr: 'Return-to-origin operating cost',
                rto_fee_discrepancy_pkr: 'Return-to-origin fee discrepancy',
              };
              return (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0">
                  <dt className="text-muted">{labelMap[k] ?? k.replace(/_/g, ' ')}</dt>
                  <dd className="max-w-[50%] text-right font-medium tabular-nums text-ink [overflow-wrap:anywhere]">{String(v)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}
