import { History, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { PublicAnalysisSummary } from '../../lib/api';

interface HistoryViewProps {
  runs: PublicAnalysisSummary[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export function HistoryView({ runs, selectedRunId, onSelectRun, loading, onRefresh }: HistoryViewProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Run History</h2>
          <p className="mt-1 text-sm text-muted">Select a run to view its reconciliation results and exceptions.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {loading && runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-[#F7F9F8] p-10 text-center text-sm text-muted">Loading runs…</div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-[#F7F9F8] p-10 text-center">
          <History className="mx-auto h-12 w-12 text-[#B8CBD4]" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">No runs yet</h2>
          <p className="mt-1 text-sm text-muted">Upload CSV files to create your first analysis.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3">Run</th>
                <th scope="col" className="px-4 py-3 text-right">Expected</th>
                <th scope="col" className="px-4 py-3 text-right">Verified paid</th>
                <th scope="col" className="px-4 py-3 text-right">Outstanding</th>
                <th scope="col" className="px-4 py-3 text-center">Quality</th>
                <th scope="col" className="px-4 py-3">Created</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {runs.map((run) => {
                const selected = run.run_id === selectedRunId;
                const quality = run.analysis_quality === 'CLEAN' ? 'clean' : run.analysis_quality === 'NO_VALID_SETTLEMENTS' ? 'error' : 'partial';
                return (
                  <tr key={run.run_id} className={`transition-colors ${selected ? 'bg-[#F0FBF7]' : 'hover:bg-[#F5F8F7]/50'}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink">{run.run_id.slice(0, 8)}</div>
                      <div className="text-[11px] text-muted">{run.seller_id} · as of {run.as_of_date ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-ink">{run.kpis_pkr.expected_receivable_pkr ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-ink">{run.kpis_pkr.verified_paid_pkr ?? run.kpis_pkr.verified_paid_paisa_pkr ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums text-ink">{run.kpis_pkr.outstanding_receivable_pkr ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center"><Badge variant={quality}>{run.analysis_quality}</Badge></td>
                    <td className="px-4 py-3.5 text-sm text-muted">{new Date(run.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant={selected ? 'primary' : 'ghost'} size="sm" onClick={() => onSelectRun(run.run_id)} leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />}>
                        {selected ? 'Selected' : 'View'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
