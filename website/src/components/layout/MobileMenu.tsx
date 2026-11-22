import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bell, Download, Menu, Share2, X } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar';
import type { PublicAnalysisRun } from '../../lib/api';

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      id="workspace-navigation"
      aria-label="Navigation menu"
      className="m-0 h-dvh max-h-none max-w-[100vw] overflow-hidden bg-surface p-0 backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Sidebar
        accountLabel={accountLabel}
        orgLabel={orgLabel}
        activeView={activeView}
        onViewChange={onViewChange}
        onClose={onClose}
        isMobile
      />
    </dialog>
  );
}

interface HeaderProps {
  view: string;
  run: PublicAnalysisRun | null;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDesktop: boolean;
  onExport: () => void;
  onViewChange: (id: string) => void;
}

export function WorkspaceHeader({
  view,
  run,
  isMobileMenuOpen,
  setMobileMenuOpen,
  isDesktop,
  onExport,
  onViewChange,
}: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState('Share');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isMobileMenuOpen) {
        setNotificationsOpen(false);
        notificationsButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen, notificationsOpen]);

  const shareRun = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Codvera Run ${run?.run_id.slice(0, 8) ?? ''}`,
          text: run ? `Seller ${run.seller_id} · ${run.analysis_quality}` : 'Codvera workspace',
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareLabel('Link copied');
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        setShareLabel('Link copied');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareLabel('Copy failed');
    }
    window.setTimeout(() => setShareLabel('Share'), 2500);
  };

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

  const exceptions = run?.counts?.exceptions ?? 0;
  const validationErrors = run?.counts?.validation_errors ?? 0;

  return (
    <header className="page-header !grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-3 md:!flex md:gap-x-3">
      <div className="flex items-center lg:hidden">
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-muted hover:bg-subtle hover:text-ink"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="dialog"
            aria-controls={isMobileMenuOpen ? 'workspace-navigation' : undefined}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <h1 className="font-display text-xl font-semibold text-ink tracking-tight">
          {viewLabels[view]}
        </h1>
        {view === 'dashboard' && run && (
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium text-muted">
            <span>Seller <span className="text-ink">{run.seller_id}</span></span>
            <span>Run <span className="font-mono text-ink">{run.run_id.slice(0, 8)}</span></span>
            <span className="whitespace-nowrap">As of <span className="text-ink">{run.as_of_date ?? '—'}</span></span>
          </p>
        )}
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 md:shrink-0">
        {run && (
          <>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#DCE7E3] bg-[#FDF2E3] px-3 py-2 text-xs font-medium text-[#92400E] hover:bg-[#FDE6C8] transition"
              aria-label="Export summary CSV"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void shareRun()}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#DCE7E3] bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-[#F5F8F7] transition"
            >
              <Share2 className="h-3 w-3" />
              {shareLabel}
            </button>
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              ref={notificationsButtonRef}
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE7E3] bg-surface text-ink hover:bg-[#F5F8F7] transition"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-4 w-4" />
              {exceptions > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 text-[10px] font-bold text-white">
                  {exceptions > 99 ? '99+' : exceptions}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-10 z-50 w-[min(20rem,calc(100vw-6rem))] rounded-xl border border-line bg-surface shadow-lift"
              >
                <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
                  Notifications
                </div>
                {run ? (
                  <div className="space-y-3 px-4 py-4 text-sm">
                    <p className="text-muted">
                      Run <span className="font-mono font-medium text-ink">{run.run_id.slice(0, 8)}</span>
                    </p>
                    <p className="text-muted">{run.quality_message}</p>
                    <dl className="space-y-1.5 rounded-lg bg-canvas p-3 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Quality</dt>
                        <dd className="font-medium text-ink">{run.analysis_quality}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Exceptions</dt>
                        <dd className="font-medium text-ink">{exceptions}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Validation errors</dt>
                        <dd className="font-medium text-ink">{validationErrors}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          onViewChange('exceptions');
                        }}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
                      >
                        Review exceptions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          onViewChange('history');
                        }}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle"
                      >
                        Run history
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-4 py-4 text-sm text-muted">
                    <p>No analysis notifications yet. Upload CSV files to create your first run.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        onViewChange('upload');
                      }}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
                    >
                      Upload &amp; analyze
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
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
