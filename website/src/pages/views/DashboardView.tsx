import { FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DashboardPreview } from '../../components/dashboard/DashboardPreview';
import { toDashboardData } from '../../lib/analysis-adapter';
import type { PublicAnalysisRun } from '../../lib/api';

interface DashboardViewProps {
  run: PublicAnalysisRun | null;
  isDark: boolean;
  loading?: boolean;
  onUploadClick?: () => void;
  onHistoryClick?: () => void;
  onExport?: () => void;
}

export function DashboardView({ run, isDark, loading, onUploadClick, onHistoryClick, onExport }: DashboardViewProps) {
  if (loading) {
    return (
      <div
        className="rounded-[14px] border border-line bg-surface p-5 shadow-sm sm:p-6"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading analysis…</span>
        <div className="h-3 w-32 rounded bg-subtle" aria-hidden="true" />
        <div className="mt-3 h-6 w-64 max-w-full rounded bg-subtle" aria-hidden="true" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          <div className="h-24 rounded-[14px] border border-line bg-canvas" />
          <div className="h-24 rounded-[14px] border border-line bg-canvas" />
          <div className="h-24 rounded-[14px] border border-line bg-canvas" />
          <div className="h-24 rounded-[14px] border border-line bg-canvas" />
        </div>
        <div className="mt-4 h-40 rounded-[14px] border border-line bg-canvas" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-muted">Loading reconciliation results…</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="rounded-[14px] border border-dashed border-line bg-surface p-10 text-center lg:p-16">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-[#B8CBD4]" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No analysis selected</h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
          Upload and analyze your CSV exports, or open a previous run to view reconciliation results, exceptions, and settlement details.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="primary" size="sm" onClick={onUploadClick}>Upload &amp; analyze</Button>
          <Button variant="ghost" size="sm" onClick={onHistoryClick}>View run history</Button>
        </div>
      </div>
    );
  }

  return <DashboardPreview embedded isDark={isDark} data={toDashboardData(run)} onExport={onExport} />;
}
