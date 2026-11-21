import { Download } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
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

  const qualityVariant: 'clean' | 'partial' | 'error' | 'neutral' =
    run.analysis_quality === 'CLEAN'
      ? 'clean'
      : run.analysis_quality === 'PARTIAL_DATA'
        ? 'partial'
        : run.analysis_quality === 'NO_VALID_SETTLEMENTS'
          ? 'error'
          : 'neutral';
  const qualityText =
    run.analysis_quality === 'CLEAN'
      ? 'Clean analysis'
      : run.analysis_quality === 'PARTIAL_DATA'
        ? 'Partial data'
        : run.analysis_quality === 'NO_VALID_SETTLEMENTS'
          ? 'Evidence gap'
          : run.analysis_quality || 'Pending';
  const created = Number.isNaN(Date.parse(run.created_at))
    ? run.created_at
    : new Date(run.created_at).toLocaleString();

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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted shadow-sm">
        <span className="font-mono font-semibold tracking-wide text-ink">RUN {run.run_id.slice(0, 8)}</span>
        <span>Seller <strong className="font-semibold text-ink">{run.seller_id}</strong></span>
        <span>As of <strong className="font-semibold text-ink">{run.as_of_date ?? '—'}</strong></span>
        <span>Engine <strong className="font-semibold text-ink">v{run.engine_version}</strong></span>
        <Badge variant={qualityVariant}>{qualityText}</Badge>
        <span className="ml-auto tabular-nums">Created {created}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line/60 pb-2 text-[11px] text-muted">
        <span title={run.output_hash}>Output hash <span className="font-mono font-semibold text-ink">{run.output_hash.slice(0, 12)}</span></span>
        <span>Schema <span className="font-mono font-semibold text-ink">{run.schema_version}</span></span>
        <span>Mapping <span className="font-mono font-semibold text-ink">{run.mapping_version}</span></span>
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
