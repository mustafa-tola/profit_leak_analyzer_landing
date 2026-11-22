import type { ReactNode } from 'react';
import { AlertCircle, Clock3, TriangleAlert } from 'lucide-react';
import type { FindingStatus } from '../../data/dashboard';
import { Badge } from '../ui/Badge';

const variantMap: Record<FindingStatus, 'clean' | 'partial' | 'error' | 'neutral' | 'info'> = {
  Provisional: 'partial',
  'Needs review': 'partial',
  Overdue: 'error',
};

const iconMap: Record<FindingStatus, ReactNode> = {
  Provisional: <Clock3 className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" />,
  'Needs review': <AlertCircle className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" />,
  Overdue: <TriangleAlert className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" />,
};

export function FindingStatusPill({ status }: { status: FindingStatus }) {
  return (
    <Badge variant={variantMap[status]} className="max-w-full gap-1.5 !px-1.5 leading-tight sm:!px-2.5" title={`Status: ${status}`}>
      {iconMap[status]}
      {status}
    </Badge>
  );
}
