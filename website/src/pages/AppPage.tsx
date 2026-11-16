import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, useAuth, useUser } from '@clerk/clerk-react';
import { AlertCircle, FileSpreadsheet, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WorkspaceHeader, MobileMenu } from '../components/layout/MobileMenu';
import { Badge } from '../components/ui/Badge';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { ExceptionsView } from './views/ExceptionsView';
import { SettlementsView } from './views/SettlementsView';
import { ReportsView } from './views/ReportsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';
import { apiUrl, getAnalysis, listAnalyses, uploadAnalysis, type PublicAnalysisRun, type PublicAnalysisSummary } from '../lib/api';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

type AppView =
  | 'dashboard'
  | 'upload'
  | 'exceptions'
  | 'settlements'
  | 'reports'
  | 'history'
  | 'settings'
  | 'help';

const VIEW_PATHS: Record<AppView, string> = {
  dashboard: '/app',
  upload: '/app/upload',
  exceptions: '/app/exceptions',
  settlements: '/app/settlements',
  reports: '/app/reports',
  history: '/app/history',
  settings: '/app/settings',
  help: '/app/help',
};

const PATH_VIEWS: Record<string, AppView> = {
  '/app': 'dashboard',
  '/app/upload': 'upload',
  '/app/exceptions': 'exceptions',
  '/app/settlements': 'settlements',
  '/app/reports': 'reports',
  '/app/history': 'history',
  '/app/settings': 'settings',
  '/app/help': 'help',
};

export function AppPage({ isDark, theme, setTheme }: { isDark: boolean; theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>> }) {
  if (!clerkKey) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold text-accent-ink">Codvera workspace</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">Live analysis setup required</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Set <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">VITE_CLERK_PUBLISHABLE_KEY</code> and{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">VITE_API_URL</code> in{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">website/.env</code>, then restart the Vite dev server.
          </p>
          <p className="mt-3 text-sm text-muted">
            API target: <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">{apiUrl()}</code>
          </p>
          <a href="/" className="mt-6 inline-flex items-center text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">Back to home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--canvas))]">
      <SignedOut>
        <Navbar theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-16">
          <section className="space-y-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted shadow-soft">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Secure seller workspace
              </p>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">Sign in to reconcile COD payments</h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
                Upload seller, courier, and settlement exports to review expected receivables, verified payments, outstanding balances, and provisional exceptions.
              </p>
            </div>
          </section>
          <section aria-label="Sign in" className="card flex justify-center p-4 sm:p-6 lg:sticky lg:top-24">
            <SignIn routing="hash" signUpUrl="/app#/sign-up" forceRedirectUrl="/app" signUpForceRedirectUrl="/app" />
          </section>
        </div>
        <Footer />
      </SignedOut>
      <SignedIn>
        <LiveAnalysisApp isDark={isDark} />
      </SignedIn>
    </main>
  );
}

function LiveAnalysisApp({ isDark }: { isDark: boolean }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState<AppView>(() => PATH_VIEWS[location.pathname] ?? 'dashboard');
  const [runs, setRuns] = useState<PublicAnalysisSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PublicAnalysisRun | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setView(PATH_VIEWS[location.pathname] ?? 'dashboard');
  }, [location.pathname]);

  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error('No Clerk session token is available. Please sign in again.');
    return t;
  }, [getToken]);

  const loadRuns = useCallback(async (opts?: { selectFirst?: boolean; selectRunId?: string }) => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await listAnalyses(await token());
      setRuns(data);
      const target = opts?.selectRunId ?? (opts?.selectFirst ? data[0]?.run_id : undefined) ?? selectedRunId;
      if (target && data.some((r) => r.run_id === target)) {
        setSelectedRunId(target);
      } else if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].run_id);
      } else if (data.length === 0) {
        setSelectedRunId(null);
        setSelectedRun(null);
      }
    } catch (e) {
      setError(handleApiError(e));
    } finally {
      setLoadingList(false);
    }
  }, [token, selectedRunId]);

  const loadRunDetail = useCallback(async (runId: string) => {
    setLoadingRun(true);
    setError(null);
    try {
      const detail = await getAnalysis(await token(), runId);
      setSelectedRun(detail);
    } catch (e) {
      setError(handleApiError(e));
      setSelectedRun(null);
    } finally {
      setLoadingRun(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRuns({ selectFirst: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRunId) void loadRunDetail(selectedRunId);
  }, [selectedRunId, loadRunDetail]);

  const handleApiError = (e: unknown): string => {
    const err = e instanceof Error ? e : new Error(String(e));
    const status = (err as Error & { status?: number }).status;
    if (status === 401 || err.message.includes('Session expired')) {
      setSelectedRun(null);
      setSelectedRunId(null);
      setRuns([]);
      return 'Your session has expired. Please sign in again.';
    }
    return err.message;
  };

  const onAnalyze = async (form: FormData) => {
    setUploading(true);
    setError(null);
    try {
      const created = await uploadAnalysis(await token(), form);
      setRuns((prev) => [created, ...prev.filter((r) => r.run_id !== created.run_id)]);
      setSelectedRunId(created.run_id);
      setSelectedRun(created);
      navigate(VIEW_PATHS.dashboard);
      setView('dashboard');
    } catch (e) {
      setError(handleApiError(e));
      throw e;
    } finally {
      setUploading(false);
    }
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    navigate(VIEW_PATHS.dashboard);
    setView('dashboard');
  };

  const handleViewChange = (id: string) => {
    const viewId = id as AppView;
    setView(viewId);
    navigate(VIEW_PATHS[viewId]);
    setMobileMenuOpen(false);
  };

  const accountLabel = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? 'Signed-in user';
  const orgLabel = 'Seller Workspace';
  const isDesktop = windowWidth >= 1024;

  const viewComponents: Record<AppView, React.ReactNode> = {
    dashboard: (
      <DashboardView
        run={selectedRun}
        isDark={isDark}
        loading={loadingRun || loadingList}
        onUploadClick={() => handleViewChange('upload')}
        onHistoryClick={() => handleViewChange('history')}
      />
    ),
    upload: <UploadView onAnalyze={onAnalyze} uploading={uploading} />,
    exceptions: <ExceptionsView run={selectedRun} />,
    settlements: <SettlementsView run={selectedRun} />,
    reports: <ReportsView run={selectedRun} />,
    history: <HistoryView runs={runs} selectedRunId={selectedRunId} onSelectRun={handleSelectRun} loading={loadingList} onRefresh={() => void loadRuns()} />,
    settings: <SettingsView />,
    help: <HelpView />,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {isDesktop && (
        <aside className="sidebar w-72">
          <div className="sidebar-brand">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight text-ink dark:text-white">codvera</span>
          </div>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const active = view === item.id;
              const badge = item.id === 'exceptions' ? (selectedRun?.counts?.exceptions ?? item.badge) : item.badge;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleViewChange(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm'
                      : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {badge !== undefined && badge !== null && Number(badge) > 0 && <Badge variant="partial" className="ml-auto">{badge}</Badge>}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <button type="button" onClick={() => handleViewChange('settings')} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition ${view === 'settings' ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm' : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <SettingsIcon className="h-5 w-5" aria-hidden="true" />Settings
            </button>
            <button type="button" onClick={() => handleViewChange('help')} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition ${view === 'help' ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm' : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <HelpIcon className="h-5 w-5" aria-hidden="true" />Help & Support
            </button>
          </div>
          <div className="border-t border-line/30 px-4 py-4">
            <div className="flex items-center gap-3 rounded-[14px] bg-accent/20 px-3 py-3">
              <UserIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink dark:text-[rgb(var(--canvas))]">{accountLabel}</p>
                <p className="text-xs text-muted">{orgLabel}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <WorkspaceHeader
          view={view}
          selected={selectedRun ? { runId: selectedRun.run_id.slice(0, 8), sellerId: selectedRun.seller_id, asOfDate: selectedRun.as_of_date ?? undefined } : null}
          isMobileMenuOpen={isMobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isDesktop={isDesktop}
        />
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-[14px] border border-danger/30 bg-danger-soft px-4 py-3.5 text-sm text-danger sm:px-5" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          {viewComponents[view]}
        </div>
      </main>

      {!isDesktop && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          accountLabel={accountLabel}
          orgLabel={orgLabel}
          activeView={view}
          onViewChange={handleViewChange}
        />
      )}
    </div>
  );
}

const SIDEBAR_ITEMS: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number | string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> },
  { id: 'upload', label: 'Upload & Analyze', icon: <UploadIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'exceptions', label: 'Exceptions', icon: <ShieldAlertIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'settlements', label: 'Settlements', icon: <FileCheckIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'reports', label: 'Reports', icon: <FileTextIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'history', label: 'Previous Runs', icon: <HistoryIcon className="h-5 w-5" aria-hidden="true" /> },
];

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
}
function ShieldAlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function FileCheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" /></svg>;
}
function FileTextIcon({ className }: { className?: string }) {
  return <FileSpreadsheet className={className} aria-hidden="true" />;
}
function HistoryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function HelpIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 68 68" aria-hidden="true" className="shrink-0">
      <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
