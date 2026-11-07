import type { FindingStatus } from '../../data/dashboard';

const styles: Record<FindingStatus, string> = {
  Provisional: 'border-warn/30 bg-warn-soft text-warn',
  'Needs review': 'border-line bg-subtle text-muted',
  Overdue: 'border-orange-700/25 bg-orange-50 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300'
};

export function FindingStatusPill({ status }: {status: FindingStatus;}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      
      {status}
    </span>);

}