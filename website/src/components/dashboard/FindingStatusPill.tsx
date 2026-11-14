import type { FindingStatus } from '../../data/dashboard';

const styles: Record<FindingStatus, string> = {
  Provisional: 'border-warn/30 bg-warn-soft text-warn',
  'Needs review': 'border-line bg-subtle text-muted',
  Overdue: 'border-danger/30 bg-danger-soft text-danger',
};

export function FindingStatusPill({ status }: { status: FindingStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}