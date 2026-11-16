import type { FindingStatus } from '../../data/dashboard';
import { Badge } from '../ui/Badge';

const variantMap: Record<FindingStatus, 'clean' | 'partial' | 'error' | 'neutral' | 'info'> = {
  Provisional: 'partial',
  'Needs review': 'partial',
  Overdue: 'error',
};

export function FindingStatusPill({ status }: { status: FindingStatus }) {
  return (
    <Badge variant={variantMap[status]}>
      {status}
    </Badge>
  );
}
