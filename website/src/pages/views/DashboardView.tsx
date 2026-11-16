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
}

export function DashboardView({ run, isDark, loading, onUploadClick, onHistoryClick }: DashboardViewProps) {
  if (loading) {
    return (
      <div className="rounded-[14px] border border-line bg-surface p-10 text-center shadow-soft">
        <p className="text-sm font-medium text-muted">Loading analysis…</p>
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

  return <DashboardPreview embedded isDark={isDark} data={toDashboardData(run)} />;
}
