import { Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DashboardPreview } from '../../components/dashboard/DashboardPreview';
import { toDashboardData } from '../../lib/analysis-adapter';
import { downloadRunCsv, RUN_EXPORT_LABELS, type RunExportKind } from '../../lib/export';
import type { PublicAnalysisRun } from '../../lib/api';

interface ReportsViewProps {
  run: PublicAnalysisRun | null;
  isDark?: boolean;
}

const EXPORT_KINDS: RunExportKind[] = ['summary', 'exceptions', 'settlements'];

export function ReportsView({ run, isDark = false }: ReportsViewProps) {
  if (!run) {
    return (
      <div className="empty-state">
        <h2 className="mt-4 font-display text-lg font-semibold text-ink">No analysis selected</h2>
        <p className="mt-1 text-sm text-muted">Open a run from Dashboard or History to view the report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Report</h2>
          <p className="mt-1 text-sm text-muted">Reconciliation report for run {run.run_id.slice(0, 8)} · {run.analysis_quality}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPORT_KINDS.map((kind) => (
            <Button
              key={kind}
              variant={kind === 'summary' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => downloadRunCsv(run, kind)}
            >
              {RUN_EXPORT_LABELS[kind]} CSV
            </Button>
          ))}
        </div>
      </div>
      <DashboardPreview
        embedded
        isDark={isDark}
        data={toDashboardData(run)}
        onExport={() => downloadRunCsv(run, 'summary')}
      />
    </div>
  );
}
