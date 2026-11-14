import { UserButton } from '@clerk/clerk-react';
import { Bell, Copy, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  view: string;
  selected: { runId?: string; sellerId?: string; asOfDate?: string } | null;
}

export function Header({ view, selected }: HeaderProps) {
  const viewLabels: Record<string, string> = {
    dashboard: 'COD Analysis',
    upload: 'Upload & Analyze',
    exceptions: 'Exceptions',
    settlements: 'Settlements',
    reports: 'Reports',
    history: 'Run History',
    settings: 'Settings',
    help: 'Help & Support',
  };

  return (
    <header className="page-header">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold text-ink tracking-tight">
          {viewLabels[view]}
        </h1>
        {view === 'dashboard' && selected && (
          <p className="text-xs font-medium text-muted">
            Seller: <span className="text-ink">{selected.sellerId}</span> &nbsp;·&nbsp; Run:
            <span className="text-ink font-mono">{selected.runId}</span> &nbsp;·&nbsp; As of:
            <span className="text-ink">{selected.asOfDate ?? '—'}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {view === 'dashboard' && selected && (
          <Button variant="text" size="sm" leftIcon={<AlertCircle className="h-3 w-3" aria-hidden="true" />}>
            Export
          </Button>
        )}
        {view === 'dashboard' && selected && (
          <Button variant="ghost" size="sm" leftIcon={<Copy className="h-3 w-3" aria-hidden="true" />}>
            Share
          </Button>
        )}
        {view === 'dashboard' && (
          <div className="flex items-center gap-2">
            <Button variant="icon" size="sm" aria-label="Notifications">
              <Bell className="h-4 w-4" aria-hidden="true" />
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </header>
  );
}
