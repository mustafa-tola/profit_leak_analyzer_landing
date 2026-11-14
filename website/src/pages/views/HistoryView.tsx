import { History, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

void History;
void FileSpreadsheet;
void AlertCircle;
void Button;
void Card;
void CardBody;
void Badge;

const runs = [
  { runId: '83f3d317', sellerId: 'SELLER-DEMO', asOfDate: '07 Nov 2026, 02:14 PM', quality: 'PARTIAL_DATA', outstanding: 'PKR 68,675.00', expected: 'PKR 556,960.00', paid: 'PKR 488,285.00', createdAt: '2026-11-14T07:41:49.301Z' },
  { runId: '7e2a1c04', sellerId: 'SELLER-DEMO', asOfDate: '06 Nov 2026, 11:32 AM', quality: 'CLEAN', outstanding: 'PKR 42,100.00', expected: 'PKR 312,400.00', paid: 'PKR 270,300.00', createdAt: '2026-11-07T15:31:22.410Z' },
  { runId: 'f1a9b3c8', sellerId: 'SELLER-DEMO', asOfDate: '05 Nov 2026, 04:20 PM', quality: 'PARTIAL_DATA', outstanding: 'PKR 91,200.00', expected: 'PKR 445,800.00', paid: 'PKR 354,600.00', createdAt: '2026-11-07T15:17:41.683Z' },
];

export function HistoryView() {
  return (
    <section className="rounded-lg border border-line bg-surface shadow-soft p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Run History</h2>
        <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}>
          New Analysis
        </Button>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-[#F7F9F8] p-10 text-center">
          <History className="mx-auto h-12 w-12 text-[#B8CBD4]" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">No runs yet</h2>
          <p className="mt-1 text-sm text-muted">Upload CSV files to create your first analysis.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line rounded-lg bg-surface">
          <table className="w-full min-w-[700px] text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-[#F7F9F8] text-xs font-semibold uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3">Run ID</th>
                <th scope="col" className="px-4 py-3 text-right">Seller</th>
                <th scope="col" className="px-4 py-3 text-right">Expected</th>
                <th scope="col" className="px-4 py-3 text-right">Verified Paid</th>
                <th scope="col" className="px-4 py-3 text-right">Outstanding</th>
                <th scope="col" className="px-4 py-3 text-center">Quality</th>
                <th scope="col" className="px-4 py-3 text-left">Analyzed At</th>
                <th scope="col" className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {runs.map((run) => (
                <tr key={run.runId} className="hover:bg-[#F5F8F7]/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-xs font-medium text-ink">{run.runId}</div>
                    <div className="text-[11px] text-muted">{run.sellerId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-ink">{run.expected}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-ink">{run.paid}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium text-ink">{run.outstanding}</td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant={run.quality === 'CLEAN' ? 'clean' : 'partial'}>{run.quality}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted">{run.asOfDate}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Button variant="ghost" size="sm" leftIcon={<AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
