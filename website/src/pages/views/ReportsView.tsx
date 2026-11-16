import { DashboardPreview } from '../../components/dashboard/DashboardPreview';
import { toDashboardData } from '../../lib/analysis-adapter';
import type { PublicAnalysisRun } from '../../lib/api';

interface ReportsViewProps {
  run: PublicAnalysisRun | null;
}

export function ReportsView({ run }: ReportsViewProps) {
  if (!run) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
        <h2 className="font-display text-lg font-semibold text-ink">No analysis selected</h2>
        <p className="mt-1 text-sm text-muted">Open a run from Dashboard or History to view the report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Report</h2>
        <p className="mt-1 text-sm text-muted">Reconciliation report for run {run.run_id.slice(0, 8)} · {run.analysis_quality}.</p>
      </div>
      <DashboardPreview embedded isDark={false} data={toDashboardData(run)} />
    </div>
  );
}
