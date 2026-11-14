import { Menu, X } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  accountLabel: string;
  orgLabel: string;
  activeView: string;
  onViewChange: (id: string) => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  accountLabel,
  orgLabel,
  activeView,
  onViewChange,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar: slides in from left */}
      <Sidebar
        accountLabel={accountLabel}
        orgLabel={orgLabel}
        activeView={activeView}
        onViewChange={onViewChange}
        onClose={onClose}
        isMobile
        isOpen={isOpen}
      />
    </div>
  );
}

interface HeaderProps {
  view: string;
  selected: { runId?: string; sellerId?: string; asOfDate?: string } | null;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDesktop: boolean;
}

export function WorkspaceHeader({
  view,
  selected,
  isMobileMenuOpen,
  setMobileMenuOpen,
  isDesktop,
}: HeaderProps) {
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
      <div className="flex items-center gap-2 lg:ml-0">
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-[#B8CBD4] hover:text-[#F5F8F7] hover:bg-[#11564B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDF5EA]/50"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1 lg:ml-4">
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
          <>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#DCE7E3] bg-[#FDF2E3] px-3 py-2 text-xs font-medium text-[#92400E] hover:bg-[#FDE6C8] transition"
              aria-haspopup="dialog"
              aria-expanded="false"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Export
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#DCE7E3] bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-[#F5F8F7] transition"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Share
            </button>
          </>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE7E3] bg-surface text-ink hover:bg-[#F5F8F7] transition"
            aria-label="Notifications"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <div className="relative inline-block text-left">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  popover: 'bg-surface border border-[#DCE7E3] shadow-soft',
                  dropdownItem: 'text-sm text-ink hover:bg-[#F5F8F7] hover:text-[#0A4236]',
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
